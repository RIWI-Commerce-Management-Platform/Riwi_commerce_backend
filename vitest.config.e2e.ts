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
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? '16ZFt2XVsIKiRROiu1uzLPTjeLvpilcy',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3015',
    },
  },
});
