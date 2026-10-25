import { describe, expect, it, vi } from 'vitest';
import { UpdateCatalogItemUseCase } from './update-catalog-item.use-case.js';
import { CatalogDao } from '../domain/catalog.dao.js';
import {
  CatalogItemNotFoundError,
  InvalidCatalogTypeError,
} from '../domain/catalog-errors.js';
import {
  ClientStatus,
  ClientType,
  Portfolio,
  Potential,
  VisitResult,
} from '../domain/catalog-item.entity.js';

describe('UpdateCatalogItemUseCase', () => {
  const setup = () => {
    const dao = {
      findClientTypeById: vi.fn(),
      saveClientType: vi.fn((item) => Promise.resolve(item)),
      findPotentialById: vi.fn(),
      savePotential: vi.fn((item) => Promise.resolve(item)),
      findClientStatusById: vi.fn(),
      saveClientStatus: vi.fn((item) => Promise.resolve(item)),
      findPortfolioById: vi.fn(),
      savePortfolio: vi.fn((item) => Promise.resolve(item)),
      findVisitResultById: vi.fn(),
      saveVisitResult: vi.fn((item) => Promise.resolve(item)),
    } as unknown as CatalogDao;

    const useCase = new UpdateCatalogItemUseCase(dao);
    return { useCase, dao };
  };

  it('should update and deactivate client type', async () => {
    const { useCase, dao } = setup();
    const item = new ClientType({
      id: 1,
      name: 'Original',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(dao.findClientTypeById).mockResolvedValue(item);

    const result = (await useCase.execute({
      type: 'client-types',
      id: 1,
      name: 'Updated Name',
      isActive: false,
    })) as ClientType;

    expect(result.name).toBe('Updated Name');
    expect(result.isActive).toBe(false);
    expect(dao.saveClientType).toHaveBeenCalled();
  });

  it('should update and deactivate potential', async () => {
    const { useCase, dao } = setup();
    const item = new Potential({
      id: 2,
      name: 'Original',
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(dao.findPotentialById).mockResolvedValue(item);

    const result = (await useCase.execute({
      type: 'potentials',
      id: 2,
      name: 'New Potential',
      order: 5,
      isActive: false,
    })) as Potential;

    expect(result.name).toBe('New Potential');
    expect(result.order).toBe(5);
    expect(result.isActive).toBe(false);
  });

  it('should update and deactivate client status', async () => {
    const { useCase, dao } = setup();
    const item = new ClientStatus({
      id: 3,
      name: 'Activo',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(dao.findClientStatusById).mockResolvedValue(item);

    const result = (await useCase.execute({
      type: 'client-statuses',
      id: 3,
      name: 'Inactivo',
      isActive: false,
    })) as ClientStatus;

    expect(result.name).toBe('Inactivo');
    expect(result.isActive).toBe(false);
  });

  it('should update and deactivate portfolio', async () => {
    const { useCase, dao } = setup();
    const item = new Portfolio({
      id: 4,
      name: 'Bebidas',
      description: 'Gaseosas',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(dao.findPortfolioById).mockResolvedValue(item);

    const result = (await useCase.execute({
      type: 'portfolios',
      id: 4,
      name: 'Refrescos',
      description: 'Jugos',
      isActive: false,
    })) as Portfolio;

    expect(result.name).toBe('Refrescos');
    expect(result.description).toBe('Jugos');
    expect(result.isActive).toBe(false);
  });

  it('should update and deactivate visit result', async () => {
    const { useCase, dao } = setup();
    const item = new VisitResult({
      id: 5,
      name: 'Pendiente',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(dao.findVisitResultById).mockResolvedValue(item);

    const result = (await useCase.execute({
      type: 'visit-results',
      id: 5,
      name: 'Completada',
      isActive: false,
    })) as VisitResult;

    expect(result.name).toBe('Completada');
    expect(result.isActive).toBe(false);
  });

  it('should throw CatalogItemNotFoundError if item does not exist for any type', async () => {
    const { useCase, dao } = setup();
    vi.mocked(dao.findClientTypeById).mockResolvedValue(null);
    vi.mocked(dao.findPotentialById).mockResolvedValue(null);
    vi.mocked(dao.findClientStatusById).mockResolvedValue(null);
    vi.mocked(dao.findPortfolioById).mockResolvedValue(null);
    vi.mocked(dao.findVisitResultById).mockResolvedValue(null);

    await expect(
      useCase.execute({ type: 'client-types', id: 999 }),
    ).rejects.toThrow(CatalogItemNotFoundError);

    await expect(
      useCase.execute({ type: 'potentials', id: 999 }),
    ).rejects.toThrow(CatalogItemNotFoundError);

    await expect(
      useCase.execute({ type: 'client-statuses', id: 999 }),
    ).rejects.toThrow(CatalogItemNotFoundError);

    await expect(
      useCase.execute({ type: 'portfolios', id: 999 }),
    ).rejects.toThrow(CatalogItemNotFoundError);

    await expect(
      useCase.execute({ type: 'visit-results', id: 999 }),
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

describe('UpdateCatalogItemUseCase without changes', () => {
  const base = {
    id: 1,
    name: 'Original',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it.each([
    ['client-types', 'findClientTypeById', () => new ClientType(base)],
    [
      'potentials',
      'findPotentialById',
      () => new Potential({ ...base, order: 1 }),
    ],
    ['client-statuses', 'findClientStatusById', () => new ClientStatus(base)],
    [
      'portfolios',
      'findPortfolioById',
      () => new Portfolio({ ...base, description: 'Desc' }),
    ],
    ['visit-results', 'findVisitResultById', () => new VisitResult(base)],
  ] as const)(
    'keeps the %s item active and its name when nothing is sent',
    async (type, finder, build) => {
      const dao = {
        [finder]: vi.fn().mockResolvedValue(build()),
        saveClientType: vi.fn((item) => Promise.resolve(item)),
        savePotential: vi.fn((item) => Promise.resolve(item)),
        saveClientStatus: vi.fn((item) => Promise.resolve(item)),
        savePortfolio: vi.fn((item) => Promise.resolve(item)),
        saveVisitResult: vi.fn((item) => Promise.resolve(item)),
      } as unknown as CatalogDao;

      const result = (await new UpdateCatalogItemUseCase(dao).execute({
        type,
        id: 1,
        isActive: true,
      })) as { name: string; isActive: boolean };

      expect(result.name).toBe('Original');
      expect(result.isActive).toBe(true);
    },
  );
});
