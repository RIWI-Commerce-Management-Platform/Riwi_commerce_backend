import { describe, expect, it, vi } from 'vitest';
import { UpdateCatalogItemUseCase } from './update-catalog-item.use-case.js';
import { CatalogRepository } from '../domain/catalog.repository.js';
import {
  CatalogItemNotFoundError,
  InvalidCatalogTypeError,
} from '../domain/catalog-errors.js';
import { ClientType } from '../domain/catalog-item.entity.js';

describe('UpdateCatalogItemUseCase', () => {
  const setup = () => {
    const repository = {
      findClientTypeById: vi.fn(),
      saveClientType: vi.fn((item) => Promise.resolve(item)),
      findPotentialById: vi.fn(),
      savePotential: vi.fn((item) => Promise.resolve(item)),
    } as unknown as CatalogRepository;

    const useCase = new UpdateCatalogItemUseCase(repository);
    return { useCase, repository };
  };

  it('should update client type name', async () => {
    const { useCase, repository } = setup();
    const item = new ClientType({
      id: 1,
      name: 'Original',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(repository.findClientTypeById).mockResolvedValue(item);

    const result = (await useCase.execute({
      type: 'client-types',
      id: 1,
      name: 'Updated Name',
    })) as ClientType;

    expect(result.name).toBe('Updated Name');
    expect(repository.saveClientType).toHaveBeenCalled();
  });

  it('should throw CatalogItemNotFoundError if item does not exist', async () => {
    const { useCase, repository } = setup();
    vi.mocked(repository.findClientTypeById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        type: 'client-types',
        id: 999,
        name: 'Updated',
      }),
    ).rejects.toThrow(CatalogItemNotFoundError);
  });

  it('should throw InvalidCatalogTypeError if type is invalid', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        type: 'unknown-type',
        id: 1,
      }),
    ).rejects.toThrow(InvalidCatalogTypeError);
  });
});
