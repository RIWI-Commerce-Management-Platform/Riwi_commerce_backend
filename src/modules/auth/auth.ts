import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { UserRole } from './domain/user-role.enum.js';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`,
  // Better Auth's built-in Kysely adapter. The TypeORM adapter can't be used
  // because it doesn't support numeric ids. The tables are still created by
  // the TypeORM migrations in ./infrastructure/migrations.
  database: new Pool({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number.parseInt(process.env.POSTGRES_PORT ?? '', 10) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  }),
  advanced: {
    database: {
      // Ids are Postgres serial integers, like every other table. Better Auth
      // still returns them as strings; SessionGuard and toNumericAuthIds()
      // convert them back to numbers.
      generateId: 'serial',
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: UserRole.ASESOR,
        input: false,
      },
      zoneId: {
        type: 'number',
        required: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (persists across browser restarts when rememberMe is true)
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    process.env.BETTER_AUTH_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`,
  ],
});

export type Auth = typeof auth;
