import { describe, expect, it, vi } from 'vitest';
import { SeedCatalogsUseCase } from './seed-catalogs.use-case.js';
import { CatalogDao } from '../domain/catalog.dao.js';

describe('SeedCatalogsUseCase', () => {
  it('should call dao.seed with initial catalog data', async () => {
    const dao = {
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
    } as unknown as CatalogDao;

    const useCase = new SeedCatalogsUseCase(dao);
    const result = await useCase.execute();

    expect(result.seeded).toBe(true);
    expect(dao.seed).toHaveBeenCalledWith(
      expect.objectContaining({
        zones: expect.arrayContaining(['Barranquilla Norte', 'Soledad']),
        potentials: expect.arrayContaining([{ name: 'Alto', order: 1 }]),
      }),
    );
  });
});
