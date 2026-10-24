import { describe, expect, it, vi } from 'vitest';
import { TypeOrmCatalogRepository } from './typeorm-catalog.repository.js';
import {
  ClientType,
  Potential,
  ClientStatus,
  Portfolio,
  VisitResult,
} from '../domain/catalog-item.entity.js';

describe('TypeOrmCatalogRepository', () => {
  const createMockRepo = () => ({
    find: vi.fn().mockResolvedValue([]),
    findOneBy: vi.fn().mockResolvedValue(null),
    save: vi.fn((entity) => Promise.resolve({ ...entity, id: entity.id ?? 1 })),
    count: vi.fn().mockResolvedValue(1),
  });

  const setup = () => {
    const clientTypeRepo = createMockRepo();
    const potentialRepo = createMockRepo();
    const clientStatusRepo = createMockRepo();
    const portfolioRepo = createMockRepo();
    const visitResultRepo = createMockRepo();
    const zoneRepo = createMockRepo();

    const repo = new TypeOrmCatalogRepository(
      clientTypeRepo as any,
      potentialRepo as any,
      clientStatusRepo as any,
      portfolioRepo as any,
      visitResultRepo as any,
      zoneRepo as any,
    );

    return {
      repo,
      clientTypeRepo,
      potentialRepo,
      clientStatusRepo,
      portfolioRepo,
      visitResultRepo,
      zoneRepo,
    };
  };

  it('findAll should query all repositories and return grouped catalogs', async () => {
    const {
      repo,
      zoneRepo,
      clientTypeRepo,
      potentialRepo,
      clientStatusRepo,
      portfolioRepo,
      visitResultRepo,
    } = setup();
    const now = new Date();
    zoneRepo.find.mockResolvedValue([
      {
        id: 1,
        name: 'Zona Norte',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    clientTypeRepo.find.mockResolvedValue([
      {
        id: 2,
        name: 'Mayorista',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    potentialRepo.find.mockResolvedValue([
      {
        id: 3,
        name: 'Alto',
        order: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    clientStatusRepo.find.mockResolvedValue([
      { id: 4, name: 'Activo', isActive: true, createdAt: now, updatedAt: now },
    ]);
    portfolioRepo.find.mockResolvedValue([
      {
        id: 5,
        name: 'Lácteos',
        description: 'Quesos',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    visitResultRepo.find.mockResolvedValue([
      { id: 6, name: 'Venta', isActive: true, createdAt: now, updatedAt: now },
    ]);

    const result = await repo.findAll();
    expect(result.zones).toHaveLength(1);
    expect(result.clientTypes).toHaveLength(1);
    expect(result.potentials).toHaveLength(1);
    expect(result.clientStatuses).toHaveLength(1);
    expect(result.portfolios).toHaveLength(1);
    expect(result.visitResults).toHaveLength(1);
  });

  it('seed should populate all missing items and return counts', async () => {
    const {
      repo,
      zoneRepo,
      clientTypeRepo,
      potentialRepo,
      clientStatusRepo,
      portfolioRepo,
      visitResultRepo,
    } = setup();

    // First call: none exist
    zoneRepo.findOneBy.mockResolvedValue(null);
    clientTypeRepo.findOneBy.mockResolvedValue(null);
    potentialRepo.findOneBy.mockResolvedValue(null);
    clientStatusRepo.findOneBy.mockResolvedValue(null);
    portfolioRepo.findOneBy.mockResolvedValue(null);
    visitResultRepo.findOneBy.mockResolvedValue(null);

    const result = await repo.seed({
      zones: ['Zona Norte'],
      clientTypes: ['Mayorista'],
      potentials: [{ name: 'Alto', order: 1 }],
      clientStatuses: ['Activo'],
      portfolios: [{ name: 'Lácteos', description: 'Quesos' }],
      visitResults: ['Venta Exitosa'],
    });

    expect(result.seeded).toBe(true);
    expect(zoneRepo.save).toHaveBeenCalled();
    expect(clientTypeRepo.save).toHaveBeenCalled();
    expect(potentialRepo.save).toHaveBeenCalled();
    expect(clientStatusRepo.save).toHaveBeenCalled();
    expect(portfolioRepo.save).toHaveBeenCalled();
    expect(visitResultRepo.save).toHaveBeenCalled();
    expect(result.counts.zones).toBe(1);
  });

  it('seed should skip items that already exist', async () => {
    const {
      repo,
      zoneRepo,
      clientTypeRepo,
      potentialRepo,
      clientStatusRepo,
      portfolioRepo,
      visitResultRepo,
    } = setup();

    // Items exist
    zoneRepo.findOneBy.mockResolvedValue({ id: 1 });
    clientTypeRepo.findOneBy.mockResolvedValue({ id: 2 });
    potentialRepo.findOneBy.mockResolvedValue({ id: 3 });
    clientStatusRepo.findOneBy.mockResolvedValue({ id: 4 });
    portfolioRepo.findOneBy.mockResolvedValue({ id: 5 });
    visitResultRepo.findOneBy.mockResolvedValue({ id: 6 });

    const result = await repo.seed({
      zones: ['Zona Norte'],
      clientTypes: ['Mayorista'],
      potentials: [{ name: 'Alto', order: 1 }],
      clientStatuses: ['Activo'],
      portfolios: [{ name: 'Lácteos', description: 'Quesos' }],
      visitResults: ['Venta Exitosa'],
    });

    expect(result.seeded).toBe(true);
    expect(zoneRepo.save).not.toHaveBeenCalled();
    expect(clientTypeRepo.save).not.toHaveBeenCalled();
    expect(potentialRepo.save).not.toHaveBeenCalled();
    expect(clientStatusRepo.save).not.toHaveBeenCalled();
    expect(portfolioRepo.save).not.toHaveBeenCalled();
    expect(visitResultRepo.save).not.toHaveBeenCalled();
  });

  describe('ClientTypes', () => {
    it('findClientTypes should return list', async () => {
      const { repo, clientTypeRepo } = setup();
      clientTypeRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Mayorista',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const res = await repo.findClientTypes();
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Mayorista');
    });

    it('findClientTypeById should return item or null', async () => {
      const { repo, clientTypeRepo } = setup();
      clientTypeRepo.findOneBy.mockResolvedValueOnce({
        id: 1,
        name: 'Mayorista',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const found = await repo.findClientTypeById(1);
      expect(found?.name).toBe('Mayorista');

      clientTypeRepo.findOneBy.mockResolvedValueOnce(null);
      const notFound = await repo.findClientTypeById(99);
      expect(notFound).toBeNull();
    });

    it('saveClientType should save entity', async () => {
      const { repo, clientTypeRepo } = setup();
      const item = new ClientType({
        id: 1,
        name: 'Mayorista',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const saved = await repo.saveClientType(item);
      expect(clientTypeRepo.save).toHaveBeenCalled();
      expect(saved.id).toBe(1);
    });
  });

  describe('Potentials', () => {
    it('findPotentials and findPotentialById', async () => {
      const { repo, potentialRepo } = setup();
      potentialRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Alto',
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const list = await repo.findPotentials();
      expect(list).toHaveLength(1);

      potentialRepo.findOneBy.mockResolvedValueOnce({
        id: 1,
        name: 'Alto',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const item = await repo.findPotentialById(1);
      expect(item?.order).toBe(1);

      potentialRepo.findOneBy.mockResolvedValueOnce(null);
      expect(await repo.findPotentialById(99)).toBeNull();
    });

    it('savePotential should save entity', async () => {
      const { repo, potentialRepo } = setup();
      const item = new Potential({
        id: 1,
        name: 'Alto',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const saved = await repo.savePotential(item);
      expect(potentialRepo.save).toHaveBeenCalled();
      expect(saved.name).toBe('Alto');
    });
  });

  describe('ClientStatuses', () => {
    it('findClientStatuses and findClientStatusById', async () => {
      const { repo, clientStatusRepo } = setup();
      clientStatusRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Activo',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const list = await repo.findClientStatuses();
      expect(list).toHaveLength(1);

      clientStatusRepo.findOneBy.mockResolvedValueOnce({
        id: 1,
        name: 'Activo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const item = await repo.findClientStatusById(1);
      expect(item?.name).toBe('Activo');

      clientStatusRepo.findOneBy.mockResolvedValueOnce(null);
      expect(await repo.findClientStatusById(99)).toBeNull();
    });

    it('saveClientStatus should save entity', async () => {
      const { repo, clientStatusRepo } = setup();
      const item = new ClientStatus({
        id: 1,
        name: 'Activo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const saved = await repo.saveClientStatus(item);
      expect(clientStatusRepo.save).toHaveBeenCalled();
      expect(saved.name).toBe('Activo');
    });
  });

  describe('Portfolios', () => {
    it('findPortfolios and findPortfolioById', async () => {
      const { repo, portfolioRepo } = setup();
      portfolioRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Bebidas',
          description: 'Gaseosas',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const list = await repo.findPortfolios();
      expect(list).toHaveLength(1);

      portfolioRepo.findOneBy.mockResolvedValueOnce({
        id: 1,
        name: 'Bebidas',
        description: 'Gaseosas',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const item = await repo.findPortfolioById(1);
      expect(item?.description).toBe('Gaseosas');

      portfolioRepo.findOneBy.mockResolvedValueOnce(null);
      expect(await repo.findPortfolioById(99)).toBeNull();
    });

    it('savePortfolio should save entity', async () => {
      const { repo, portfolioRepo } = setup();
      const item = new Portfolio({
        id: 1,
        name: 'Bebidas',
        description: 'Gaseosas',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const saved = await repo.savePortfolio(item);
      expect(portfolioRepo.save).toHaveBeenCalled();
      expect(saved.name).toBe('Bebidas');
    });
  });

  describe('VisitResults', () => {
    it('findVisitResults and findVisitResultById', async () => {
      const { repo, visitResultRepo } = setup();
      visitResultRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Venta',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const list = await repo.findVisitResults();
      expect(list).toHaveLength(1);

      visitResultRepo.findOneBy.mockResolvedValueOnce({
        id: 1,
        name: 'Venta',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const item = await repo.findVisitResultById(1);
      expect(item?.name).toBe('Venta');

      visitResultRepo.findOneBy.mockResolvedValueOnce(null);
      expect(await repo.findVisitResultById(99)).toBeNull();
    });

    it('saveVisitResult should save entity', async () => {
      const { repo, visitResultRepo } = setup();
      const item = new VisitResult({
        id: 1,
        name: 'Venta',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const saved = await repo.saveVisitResult(item);
      expect(visitResultRepo.save).toHaveBeenCalled();
      expect(saved.name).toBe('Venta');
    });
  });
});
