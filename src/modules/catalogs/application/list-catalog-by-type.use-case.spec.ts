import { describe, expect, it, vi } from 'vitest';
import { ListCatalogByTypeUseCase } from './list-catalog-by-type.use-case.js';
import { CatalogRepository } from '../domain/catalog.repository.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';

describe('ListCatalogByTypeUseCase', () => {
  const setup = () => {
    const catalogRepository = {
      findClientTypes: vi.fn().mockResolvedValue(['client-type']),
      findPotentials: vi.fn().mockResolvedValue(['potential']),
      findClientStatuses: vi.fn().mockResolvedValue(['client-status']),
      findPortfolios: vi.fn().mockResolvedValue(['portfolio']),
      findVisitResults: vi.fn().mockResolvedValue(['visit-result']),
    } as unknown as CatalogRepository;

    const useCase = new ListCatalogByTypeUseCase(catalogRepository);
    return { useCase, catalogRepository };
  };

  it('should return client types', async () => {
    const { useCase, catalogRepository } = setup();
    const result = await useCase.execute('client-types');
    expect(catalogRepository.findClientTypes).toHaveBeenCalled();
    expect(result).toEqual(['client-type']);
  });

  it('should return potentials', async () => {
    const { useCase, catalogRepository } = setup();
    const result = await useCase.execute('potentials');
    expect(catalogRepository.findPotentials).toHaveBeenCalled();
    expect(result).toEqual(['potential']);
  });

  it('should return client statuses', async () => {
    const { useCase, catalogRepository } = setup();
    const result = await useCase.execute('client-statuses');
    expect(catalogRepository.findClientStatuses).toHaveBeenCalled();
    expect(result).toEqual(['client-status']);
  });

  it('should return portfolios', async () => {
    const { useCase, catalogRepository } = setup();
    const result = await useCase.execute('portfolios');
    expect(catalogRepository.findPortfolios).toHaveBeenCalled();
    expect(result).toEqual(['portfolio']);
  });

  it('should return visit results', async () => {
    const { useCase, catalogRepository } = setup();
    const result = await useCase.execute('visit-results');
    expect(catalogRepository.findVisitResults).toHaveBeenCalled();
    expect(result).toEqual(['visit-result']);
  });

  it('should throw InvalidCatalogTypeError for unknown catalog type', async () => {
    const { useCase } = setup();
    await expect(useCase.execute('unknown-type')).rejects.toThrow(
      InvalidCatalogTypeError,
    );
  });
});
