import { describe, expect, it, vi } from 'vitest';
import { ListCatalogByTypeUseCase } from './list-catalog-by-type.use-case.js';
import { CatalogDao } from '../domain/catalog.dao.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';

describe('ListCatalogByTypeUseCase', () => {
  const setup = () => {
    const catalogDao = {
      findClientTypes: vi.fn().mockResolvedValue(['client-type']),
      findPotentials: vi.fn().mockResolvedValue(['potential']),
      findClientStatuses: vi.fn().mockResolvedValue(['client-status']),
      findPortfolios: vi.fn().mockResolvedValue(['portfolio']),
      findVisitResults: vi.fn().mockResolvedValue(['visit-result']),
    } as unknown as CatalogDao;

    const useCase = new ListCatalogByTypeUseCase(catalogDao);
    return { useCase, catalogDao };
  };

  it('should return client types', async () => {
    const { useCase, catalogDao } = setup();
    const result = await useCase.execute('client-types');
    expect(catalogDao.findClientTypes).toHaveBeenCalled();
    expect(result).toEqual(['client-type']);
  });

  it('should return potentials', async () => {
    const { useCase, catalogDao } = setup();
    const result = await useCase.execute('potentials');
    expect(catalogDao.findPotentials).toHaveBeenCalled();
    expect(result).toEqual(['potential']);
  });

  it('should return client statuses', async () => {
    const { useCase, catalogDao } = setup();
    const result = await useCase.execute('client-statuses');
    expect(catalogDao.findClientStatuses).toHaveBeenCalled();
    expect(result).toEqual(['client-status']);
  });

  it('should return portfolios', async () => {
    const { useCase, catalogDao } = setup();
    const result = await useCase.execute('portfolios');
    expect(catalogDao.findPortfolios).toHaveBeenCalled();
    expect(result).toEqual(['portfolio']);
  });

  it('should return visit results', async () => {
    const { useCase, catalogDao } = setup();
    const result = await useCase.execute('visit-results');
    expect(catalogDao.findVisitResults).toHaveBeenCalled();
    expect(result).toEqual(['visit-result']);
  });

  it('should throw InvalidCatalogTypeError for unknown catalog type', async () => {
    const { useCase } = setup();
    await expect(useCase.execute('unknown-type')).rejects.toThrow(
      InvalidCatalogTypeError,
    );
  });
});
