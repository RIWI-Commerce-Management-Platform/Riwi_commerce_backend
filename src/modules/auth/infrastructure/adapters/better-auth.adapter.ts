import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import { IsNull } from 'typeorm';
import dataSource from '../../../../shared/config/data-source.js';
import { UserRole } from '../../domain/user-role.enum.js';
import { AdvisorOrmEntity } from '../../../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../../../clients/infrastructure/client.orm-entity.js';
import { sendPasswordResetEmail } from '../password-reset-mailer.js';

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET;
const microsoftTenantId = process.env.MICROSOFT_TENANT_ID;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const microsoftConfigurationPresent = [
  microsoftClientId,
  microsoftClientSecret,
  microsoftTenantId,
].some(Boolean);

if (!betterAuthSecret || betterAuthSecret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
}

if (
  microsoftConfigurationPresent &&
  (!microsoftClientId || !microsoftClientSecret || !microsoftTenantId)
) {
  throw new Error(
    'MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_TENANT_ID must all be configured',
  );
}

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const baseURL =
  process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

type UnlinkedProfile =
  | { role: UserRole.ASESOR; advisor: AdvisorOrmEntity }
  | { role: UserRole.CLIENTE; client: ClientOrmEntity };

async function findUnlinkedProfile(
  email: string,
): Promise<UnlinkedProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const [advisors, clients] = await Promise.all([
    dataSource
      .getRepository(AdvisorOrmEntity)
      .createQueryBuilder('advisor')
      .where('LOWER(advisor.correo) = :email', { email: normalizedEmail })
      .andWhere('advisor.idUsuario IS NULL')
      .take(2)
      .getMany(),
    dataSource
      .getRepository(ClientOrmEntity)
      .createQueryBuilder('client')
      .where('LOWER(client.email) = :email', { email: normalizedEmail })
      .andWhere('client.idUsuario IS NULL')
      .take(2)
      .getMany(),
  ]);

  if (advisors.length + clients.length !== 1) {
    return null;
  }

  const advisor = advisors[0];
  if (advisor) {
    return { role: UserRole.ASESOR, advisor };
  }
  const client = clients[0];
  return client ? { role: UserRole.CLIENTE, client } : null;
}

interface MicrosoftProfile {
  email?: string;
  preferred_username?: string;
  email_verified?: boolean;
  verified_primary_email?: string[];
  verified_secondary_email?: string[];
  xms_edov?: boolean;
}

function mapMicrosoftProfileToUser(profile: MicrosoftProfile) {
  const email = profile.email ?? profile.preferred_username;
  const hasVerifiedEmail =
    profile.email_verified !== undefined
      ? profile.email_verified
      : (typeof profile.email === 'string' &&
          (profile.verified_primary_email?.includes(profile.email) === true ||
            profile.verified_secondary_email?.includes(profile.email) ===
              true)) ||
        profile.xms_edov === true;

  if (!email || !hasVerifiedEmail) {
    throw new Error('Microsoft sign-in requires a verified email address');
  }

  return { email: email.toLowerCase(), emailVerified: true };
}

export const auth = betterAuth({
  secret: betterAuthSecret,
  baseURL,
  database: typeormAdapter(dataSource),
  trustedOrigins: [frontendUrl, baseURL],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: UserRole.CLIENTE,
        input: false,
      },
      zoneId: {
        type: 'number',
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.emailVerified) {
            return false;
          }
          const profile = await findUnlinkedProfile(user.email);
          if (!profile) {
            return false;
          }
          return { data: { ...user, role: profile.role } };
        },
        after: async (user) => {
          const profile = await findUnlinkedProfile(user.email);
          if (!profile) {
            throw new Error('The auth user profile could not be linked');
          }
          const result =
            profile.role === UserRole.ASESOR
              ? await dataSource
                  .getRepository(AdvisorOrmEntity)
                  .update(
                    {
                      idAsesor: profile.advisor.idAsesor,
                      idUsuario: IsNull(),
                    },
                    { idUsuario: user.id },
                  )
              : await dataSource
                  .getRepository(ClientOrmEntity)
                  .update(
                    { id: profile.client.id, idUsuario: IsNull() },
                    { idUsuario: user.id },
                  );
          if (result.affected !== 1) {
            throw new Error('The auth user profile could not be linked');
          }
        },
      },
      update: {
        before: async (user) => {
          if (user.email !== undefined) {
            return false;
          }
        },
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['microsoft'],
      requireLocalEmailVerified: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    resetPasswordTokenExpiresIn:
      Number.parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_SECONDS ?? '', 10) ||
      1800,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  socialProviders:
    microsoftClientId && microsoftClientSecret && microsoftTenantId
      ? {
          microsoft: {
            clientId: microsoftClientId,
            clientSecret: microsoftClientSecret,
            tenantId: microsoftTenantId,
            prompt: 'select_account',
            mapProfileToUser: mapMicrosoftProfileToUser,
          },
        }
      : {},
});

export type Auth = typeof auth;
