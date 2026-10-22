import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import dataSource from '../../shared/config/data-source.js';
import { UserRole } from './domain/user-role.enum.js';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`,
  database: typeormAdapter(dataSource),
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
