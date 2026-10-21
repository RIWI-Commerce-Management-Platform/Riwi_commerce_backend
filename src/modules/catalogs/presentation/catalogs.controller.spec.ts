import { describe, expect, it, vi } from 'vitest';
import { CatalogsController } from './catalogs.controller.js';
import { ListCatalogsUseCase } from '../application/list-catalogs.use-case.js';
import { ListCatalogByTypeUseCase } from '../application/list-catalog-by-type.use-case.js';
import { CreateCatalogItemUseCase } from '../application/create-catalog-item.use-case.js';
import { UpdateCatalogItemUseCase } from '../application/update-catalog-item.use-case.js';
import { SeedCatalogsUseCase } from '../application/seed-catalogs.use-case.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CatalogItemNotFoundError,
  InvalidCatalogTypeError,
} from '../domain/catalog-errors.js';
import { ClientType } from '../domain/catalog-item.entity.js';

describe('CatalogsController', () => {
  const setup = () => {
    const listAll = { execute: vi.fn() } as unknown as ListCatalogsUseCase;
    const listByType = {
      execute: vi.fn(),
    } as unknown as ListCatalogByTypeUseCase;
    const createItem = {
      execute: vi.fn(),
    } as unknown as CreateCatalogItemUseCase;
    const updateItem = {
      execute: vi.fn(),
    } as unknown as UpdateCatalogItemUseCase;
    const seed = { execute: vi.fn() } as unknown as SeedCatalogsUseCase;

    const controller = new CatalogsController(
      listAll,
      listByType,
      createItem,
      updateItem,
      seed,
    );

    return { controller, listAll, listByType, createItem, updateItem, seed };
  };

  it('should get all catalogs grouped', async () => {
    const { controller, listAll } = setup();
    vi.mocked(listAll.execute).mockResolvedValue({
      zones: [],
      clientTypes: [
        new ClientType({
          id: 1,
          name: 'Mayorista',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ],
      potentials: [],
      clientStatuses: [],
      portfolios: [],
      visitResults: [],
    });

    const result = await controller.getAll();
    expect(result.clientTypes).toHaveLength(1);
    expect(result.clientTypes[0].name).toBe('Mayorista');
  });

  it('should get items by type', async () => {
    const { controller, listByType } = setup();
    vi.mocked(listByType.execute).mockResolvedValue([
      new ClientType({
        id: 1,
        name: 'Mayorista',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ]);

    const result = await controller.getByType('client-types');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Mayorista');
  });

  it('should throw BadRequestException when invalid type passed', async () => {
    const { controller, listByType } = setup();
    vi.mocked(listByType.execute).mockRejectedValue(
      new InvalidCatalogTypeError('bad-type'),
    );

    await expect(controller.getByType('bad-type')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create a catalog item', async () => {
    const { controller, createItem } = setup();
    vi.mocked(createItem.execute).mockResolvedValue(
      new ClientType({
        id: 1,
        name: 'Distribuidor',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await controller.create('client-types', {
      name: 'Distribuidor',
    });
    expect(result.name).toBe('Distribuidor');
  });

  it('should update a catalog item using PATCH', async () => {
    const { controller, updateItem } = setup();
    vi.mocked(updateItem.execute).mockResolvedValue(
      new ClientType({
        id: 1,
        name: 'Distribuidor Plus',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await controller.update('client-types', 1, {
      name: 'Distribuidor Plus',
    });
    expect(result.name).toBe('Distribuidor Plus');
  });

  it('should throw NotFoundException if item to update not found', async () => {
    const { controller, updateItem } = setup();
    vi.mocked(updateItem.execute).mockRejectedValue(
      new CatalogItemNotFoundError('client-types', 999),
    );

    await expect(
      controller.update('client-types', 999, { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});
