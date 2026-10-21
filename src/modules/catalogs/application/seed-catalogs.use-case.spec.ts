import { describe, expect, it, vi } from 'vitest';
import { SeedCatalogsUseCase, INITIAL_CATALOG_SEED } from './seed-catalogs.use-case.js';
import { CatalogRepository } from '../domain/catalog.repository.js';

describe('SeedCatalogsUseCase', () => {
  it('should call repository.seed with initial catalog data', async () => {
    const repository = {
      seed: vi.fn().mockResolvedValue({
        seeded: true,
        counts: {
          zones: 5,
          clientTypes: 5,
          potentials: 3,
          clientStatuses: 4,
          portfolios: 4,
          visitResults: 6,
        },
      }),
    } as unknown as CatalogRepository;

    const useCase = new SeedCatalogsUseCase(repository);
    const result = await useCase.execute();

    expect(result.seeded).toBe(true);
    expect(repository.seed).toHaveBeenCalledWith(
      expect.objectContaining({
        zones: expect.arrayContaining(['Barranquilla Norte', 'Soledad']),
        potentials: expect.arrayContaining([{ name: 'Alto', order: 1 }]),
      }),
    );
  });
});
