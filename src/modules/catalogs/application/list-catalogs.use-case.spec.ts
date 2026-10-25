import { describe, expect, it, vi } from 'vitest';
import { ListCatalogsUseCase } from './list-catalogs.use-case.js';
import { AllCatalogs, CatalogDao } from '../domain/catalog.dao.js';

describe('ListCatalogsUseCase', () => {
  it('should call catalogDao.findAll and return all catalogs', async () => {
    const mockCatalogs: AllCatalogs = {
      zones: [],
      clientTypes: [],
      potentials: [],
      clientStatuses: [],
      portfolios: [],
      visitResults: [],
    };

    const catalogDao = {
      findAll: vi.fn().mockResolvedValue(mockCatalogs),
    } as unknown as CatalogDao;

    const useCase = new ListCatalogsUseCase(catalogDao);
    const result = await useCase.execute();

    expect(catalogDao.findAll).toHaveBeenCalled();
    expect(result).toBe(mockCatalogs);
  });
});
