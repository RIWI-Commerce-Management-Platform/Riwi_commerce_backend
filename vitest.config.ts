import { defineConfig } from 'vitest/config';
import { ignoreDecoratorCoverage } from './test/ignore-decorator-coverage.plugin.js';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  plugins: [ignoreDecoratorCoverage()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    setupFiles: ['./test/unit-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
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
        'src/seeds/**',
        // Ports written as abstract classes or interfaces: no runnable code.
        'src/modules/*/domain/*.dao.ts',
        'src/modules/*/domain/dao/*.dao.ts',
        'src/modules/*/application/ports/*.port.ts',
        'src/shared/activity-log/domain/activity-log.service.ts',
        'src/shared/auth/domain/current-advisor.provider.ts',
        'src/shared/clients/domain/client-reader.ts',
        'src/shared/file-storage/domain/file-storage.service.ts',
      ],
    },
  },
});
