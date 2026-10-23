import { describe, expect, it, vi } from 'vitest';
import { TypeOrmRouteRepository } from './typeorm-route.repository.js';
import { RouteOrmEntity } from './route.orm-entity.js';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

describe('TypeOrmRouteRepository', () => {
  const mockOrmRoute: RouteOrmEntity = {
    id: 1,
    name: 'Ruta 1',
    description: 'Desc',
    zoneId: 1,
    advisorId: 5,
    dayOfWeek: 'MONDAY',
    frequency: 'WEEKLY',
    startTime: '08:00:00',
    endTime: '17:00:00',
    startDate: new Date('2026-10-26'),
    endDate: null,
    status: 'DRAFT',
    totalDistanceKm: 10,
    estimatedDurationMinutes: 60,
    isActive: true,
    stops: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockQueryBuilder = (result: any = mockOrmRoute) => {
    const qb: any = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(result),
      getManyAndCount: vi.fn().mockResolvedValue([[result], 1]),
    };
    return qb as SelectQueryBuilder<RouteOrmEntity>;
  };

  const createMockDataSource = () => {
    return {
      transaction: vi.fn().mockImplementation((cb: (manager: any) => Promise<any>) => {
        const manager = {
          getRepository: vi.fn().mockImplementation((entity) => {
            if (entity === RouteOrmEntity) {
              return {
                save: vi.fn().mockImplementation((r) => Promise.resolve({ ...r, id: r.id || 1 })),
              };
            }
            if (entity === RouteStopOrmEntity) {
              return {
                delete: vi.fn().mockResolvedValue(undefined),
                save: vi.fn().mockImplementation((stops) => Promise.resolve(stops)),
              };
            }
            return {};
          }),
        };
        return cb(manager);
      }),
    } as unknown as DataSource;
  };

  it('should find route by id', async () => {
    const qb = createMockQueryBuilder();
    const routeRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(qb),
    } as unknown as Repository<RouteOrmEntity>;
    const stopRepo = {} as Repository<RouteStopOrmEntity>;

    const repo = new TypeOrmRouteRepository(routeRepo, stopRepo, createMockDataSource());
    const result = await repo.findById(1);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe('Ruta 1');
  });

  it('should find route by name and zone', async () => {
    const qb = createMockQueryBuilder();
    const routeRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(qb),
    } as unknown as Repository<RouteOrmEntity>;
    const stopRepo = {} as Repository<RouteStopOrmEntity>;

    const repo = new TypeOrmRouteRepository(routeRepo, stopRepo, createMockDataSource());
    const result = await repo.findByNameAndZone('Ruta 1', 1);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Ruta 1');
  });

  it('should find paginated routes applying filter criteria', async () => {
    const qb = createMockQueryBuilder();
    const routeRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(qb),
    } as unknown as Repository<RouteOrmEntity>;
    const stopRepo = {} as Repository<RouteStopOrmEntity>;

    const repo = new TypeOrmRouteRepository(routeRepo, stopRepo, createMockDataSource());
    const result = await repo.findPaginated({
      zoneId: 1,
      advisorId: 5,
      search: 'Ruta',
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('should save a route and its stops transactionally', async () => {
    const routeRepo = {} as Repository<RouteOrmEntity>;
    const stopRepo = {} as Repository<RouteStopOrmEntity>;
    const ds = createMockDataSource();

    const repo = new TypeOrmRouteRepository(routeRepo, stopRepo, ds);

    const domain = new Route({
      id: 1,
      name: 'Ruta Test',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
    });
    domain.addStop(101);

    const saved = await repo.save(domain);

    expect(saved.name).toBe('Ruta Test');
    expect(ds.transaction).toHaveBeenCalled();
  });

  it('should delete route by id', async () => {
    const routeRepo = {
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as Repository<RouteOrmEntity>;
    const stopRepo = {} as Repository<RouteStopOrmEntity>;

    const repo = new TypeOrmRouteRepository(routeRepo, stopRepo, createMockDataSource());
    await repo.delete(1);

    expect(routeRepo.delete).toHaveBeenCalledWith(1);
  });
});
