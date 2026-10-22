import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import dataSource from '../../shared/config/data-source.js';
import { UserRole } from './domain/user-role.enum.js';
import { sendPasswordResetEmail } from './infrastructure/password-reset-mailer.js';

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
        defaultValue: UserRole.ASESOR,
        input: false,
      },
      zoneId: {
        type: 'string',
        required: false,
        input: false,
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
