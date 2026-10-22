import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    pool: 'forks',
    include: ['**/*.e2e-spec.ts'],
    fileParallelism: false,
    server: {
      deps: {
        inline: ['better-auth', '@better-auth/utils', '@noble/hashes'],
      },
    },
    env: {
      POSTGRES_HOST: process.env.POSTGRES_HOST ?? 'localhost',
      POSTGRES_PORT: process.env.POSTGRES_PORT ?? '5432',
      POSTGRES_USER: process.env.POSTGRES_USER ?? 'test',
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? 'test',
      POSTGRES_DB: process.env.POSTGRES_DB ?? 'commerce_db',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
      JWT_SECRET:
        process.env.JWT_SECRET ??
        'e2e-test-jwt-secret-at-least-thirty-two-characters',
      JWT_ACCESS_TTL_SECONDS: process.env.JWT_ACCESS_TTL_SECONDS ?? '900',
      JWT_REFRESH_TTL_SECONDS: process.env.JWT_REFRESH_TTL_SECONDS ?? '604800',
    },
  },
});
