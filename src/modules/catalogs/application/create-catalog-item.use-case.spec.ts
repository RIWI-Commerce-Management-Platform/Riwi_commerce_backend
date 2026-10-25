import { describe, expect, it, vi } from 'vitest';
import { CreateCatalogItemUseCase } from './create-catalog-item.use-case.js';
import { CatalogDao } from '../domain/catalog.dao.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';
import {
  ClientStatus,
  ClientType,
  Portfolio,
  Potential,
  VisitResult,
} from '../domain/catalog-item.entity.js';

describe('CreateCatalogItemUseCase', () => {
  const setup = () => {
    const dao = {
      saveClientType: vi.fn((item) => Promise.resolve(item)),
      savePotential: vi.fn((item) => Promise.resolve(item)),
      saveClientStatus: vi.fn((item) => Promise.resolve(item)),
      savePortfolio: vi.fn((item) => Promise.resolve(item)),
      saveVisitResult: vi.fn((item) => Promise.resolve(item)),
    } as unknown as CatalogDao;

    const useCase = new CreateCatalogItemUseCase(dao);
    return { useCase, dao };
  };

  it('should create a client type successfully', async () => {
    const { useCase, dao } = setup();

    const result = (await useCase.execute({
      type: 'client-types',
      name: 'Supermercado',
    })) as ClientType;

    expect(result.name).toBe('Supermercado');
    expect(result.id).toBeUndefined();
    expect(dao.saveClientType).toHaveBeenCalled();
  });

  it('should create a potential successfully with default order and explicit order', async () => {
    const { useCase } = setup();

    const res1 = (await useCase.execute({
      type: 'potentials',
      name: 'Alto',
    })) as Potential;
    expect(res1.name).toBe('Alto');
    expect(res1.order).toBe(1);

    const res2 = (await useCase.execute({
      type: 'potentials',
      name: 'Bajo',
      order: 3,
    })) as Potential;
    expect(res2.order).toBe(3);
  });

  it('should create a client status successfully', async () => {
    const { useCase, dao } = setup();

    const result = (await useCase.execute({
      type: 'client-statuses',
      name: 'Activo',
    })) as ClientStatus;

    expect(result.name).toBe('Activo');
    expect(dao.saveClientStatus).toHaveBeenCalled();
  });

  it('should create a portfolio successfully with description and without', async () => {
    const { useCase } = setup();

    const res1 = (await useCase.execute({
      type: 'portfolios',
      name: 'Lácteos',
      description: 'Leches y quesos',
    })) as Portfolio;
    expect(res1.name).toBe('Lácteos');
    expect(res1.description).toBe('Leches y quesos');

    const res2 = (await useCase.execute({
      type: 'portfolios',
      name: 'Carnes',
    })) as Portfolio;
    expect(res2.description).toBe('');
  });

  it('should create a visit result successfully', async () => {
    const { useCase, dao } = setup();

    const result = (await useCase.execute({
      type: 'visit-results',
      name: 'Venta',
    })) as VisitResult;

    expect(result.name).toBe('Venta');
    expect(dao.saveVisitResult).toHaveBeenCalled();
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
