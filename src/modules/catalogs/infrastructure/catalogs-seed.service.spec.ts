import { describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { CatalogsSeedService } from './catalogs-seed.service.js';
import { SeedCatalogsUseCase } from '../application/seed-catalogs.use-case.js';

describe('CatalogsSeedService', () => {
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  it('should call seedCatalogsUseCase.execute onApplicationBootstrap successfully', async () => {
    const seedCatalogsUseCase = {
      execute: vi.fn().mockResolvedValue({ counts: { zones: 5 } }),
    } as unknown as SeedCatalogsUseCase;

    const service = new CatalogsSeedService(seedCatalogsUseCase);
    await service.onApplicationBootstrap();

    expect(seedCatalogsUseCase.execute).toHaveBeenCalled();
  });

  it('should catch and log error if seedCatalogsUseCase fails', async () => {
    const seedCatalogsUseCase = {
      execute: vi.fn().mockRejectedValue(new Error('Seed failed')),
    } as unknown as SeedCatalogsUseCase;

    const service = new CatalogsSeedService(seedCatalogsUseCase);
    await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
  });
});
