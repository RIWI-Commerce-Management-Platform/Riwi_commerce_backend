import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      clean: true,
      exclude: [
        'dist/**',
        'coverage/**',
        '**/*.spec.ts',
        '**/*.orm-entity.ts',
        '**/*.mapper.ts',
        '**/*.dto.ts',
        '**/*.module.ts',
        'src/main.ts',
        'src/shared/config/**',
        'src/modules/auth/auth.ts',
        'src/modules/auth/infrastructure/adapters/better-auth.adapter.ts',
        'src/**/ports/**',
        'src/**/domain/*repository.ts',
        'src/**/domain/dao/**',
        'src/shared/**/domain/activity-log.service.ts',
        'src/shared/**/domain/current-advisor.provider.ts',
        'src/shared/**/domain/client-reader.ts',
        'src/shared/**/domain/file-storage.service.ts',
      ],
    },
    env: {
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'unit-test-better-auth-secret-at-least-thirty-two-characters',
    },
  },
});
