import { describe, expect, it, vi } from 'vitest';
import { CreateCatalogItemUseCase } from './create-catalog-item.use-case.js';
import { CatalogRepository } from '../domain/catalog.repository.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';
import { ClientType } from '../domain/catalog-item.entity.js';

describe('CreateCatalogItemUseCase', () => {
  const setup = () => {
    const repository = {
      saveClientType: vi.fn((item) => Promise.resolve(item)),
      savePotential: vi.fn((item) => Promise.resolve(item)),
      saveClientStatus: vi.fn((item) => Promise.resolve(item)),
      savePortfolio: vi.fn((item) => Promise.resolve(item)),
      saveVisitResult: vi.fn((item) => Promise.resolve(item)),
    } as unknown as CatalogRepository;

    const useCase = new CreateCatalogItemUseCase(repository);
    return { useCase, repository };
  };

  it('should create a client type successfully', async () => {
    const { useCase, repository } = setup();

    const result = (await useCase.execute({
      type: 'client-types',
      name: 'Supermercado',
    })) as ClientType;

    expect(result.name).toBe('Supermercado');
    expect(result.id).toBeDefined();
    expect(repository.saveClientType).toHaveBeenCalled();
  });

  it('should throw InvalidCatalogTypeError for unknown catalog type', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        type: 'invalid-catalog',
        name: 'Test',
      }),
    ).rejects.toThrow(InvalidCatalogTypeError);
  });
});
