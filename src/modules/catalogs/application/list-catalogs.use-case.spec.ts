import { describe, expect, it, vi } from 'vitest';
import { ListCatalogsUseCase } from './list-catalogs.use-case.js';
import { AllCatalogs, CatalogRepository } from '../domain/catalog.repository.js';

describe('ListCatalogsUseCase', () => {
  it('should call catalogRepository.findAll and return all catalogs', async () => {
    const mockCatalogs: AllCatalogs = {
      zones: [],
      clientTypes: [],
      potentials: [],
      clientStatuses: [],
      portfolios: [],
      visitResults: [],
    };

    const catalogRepository = {
      findAll: vi.fn().mockResolvedValue(mockCatalogs),
    } as unknown as CatalogRepository;

    const useCase = new ListCatalogsUseCase(catalogRepository);
    const result = await useCase.execute();

    expect(catalogRepository.findAll).toHaveBeenCalled();
    expect(result).toBe(mockCatalogs);
  });
});
