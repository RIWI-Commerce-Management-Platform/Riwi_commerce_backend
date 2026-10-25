import { describe, expect, it, vi } from 'vitest';
import { TypeOrmRouteDao } from './typeorm-route.dao.js';
import { RouteOrmEntity } from './route.orm-entity.js';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

describe('TypeOrmRouteDao', () => {
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
      transaction: vi
        .fn()
        .mockImplementation((cb: (manager: any) => Promise<any>) => {
          const manager = {
            getRepository: vi.fn().mockImplementation((entity) => {
              if (entity === RouteOrmEntity) {
                return {
                  save: vi
                    .fn()
                    .mockImplementation((r) =>
                      Promise.resolve({ ...r, id: r.id || 1 }),
                    ),
                };
              }
              if (entity === RouteStopOrmEntity) {
                return {
                  delete: vi.fn().mockResolvedValue(undefined),
                  save: vi
                    .fn()
                    .mockImplementation((stops) => Promise.resolve(stops)),
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

    const repo = new TypeOrmRouteDao(
      routeRepo,
      stopRepo,
      createMockDataSource(),
    );
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

    const repo = new TypeOrmRouteDao(
      routeRepo,
      stopRepo,
      createMockDataSource(),
    );
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

    const repo = new TypeOrmRouteDao(
      routeRepo,
      stopRepo,
      createMockDataSource(),
    );
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

    const repo = new TypeOrmRouteDao(routeRepo, stopRepo, ds);

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

    const repo = new TypeOrmRouteDao(
      routeRepo,
      stopRepo,
      createMockDataSource(),
    );
    await repo.delete(1);

    expect(routeRepo.delete).toHaveBeenCalledWith(1);
  });

  const buildDao = (
    qb = createMockQueryBuilder(),
    ds = createMockDataSource(),
  ) =>
    new TypeOrmRouteDao(
      {
        createQueryBuilder: vi.fn().mockReturnValue(qb),
      } as unknown as Repository<RouteOrmEntity>,
      {} as Repository<RouteStopOrmEntity>,
      ds,
    );

  it('returns null when no route matches the id or the name', async () => {
    const dao = buildDao(createMockQueryBuilder(null));

    expect(await dao.findById(99)).toBeNull();
    expect(await dao.findByNameAndZone('Nope', 1)).toBeNull();
  });

  it('applies every filter and caps the page size at 100', async () => {
    const qb = createMockQueryBuilder();
    const dao = buildDao(qb);

    const result = await dao.findPaginated({
      status: 'ACTIVE' as any,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      isActive: false,
      page: 2,
      limit: 500,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('route.status = :status', {
      status: 'ACTIVE',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('route.day_of_week = :dayOfWeek', {
      dayOfWeek: DayOfWeek.MONDAY,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('route.frequency = :frequency', {
      frequency: RouteFrequency.WEEKLY,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('route.is_active = :isActive', {
      isActive: false,
    });
    expect(qb.skip).toHaveBeenCalledWith(100);
    expect(qb.take).toHaveBeenCalledWith(100);
    expect(result.meta).toMatchObject({ page: 2, limit: 100 });
  });

  it('falls back to page 1 with 10 routes when no paging is sent', async () => {
    const qb = createMockQueryBuilder();

    const result = await buildDao(qb).findPaginated({});

    expect(qb.andWhere).not.toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('saves a new route without stops and without deleting old ones', async () => {
    const stopDelete = vi.fn();
    const routeSave = vi.fn((r) => Promise.resolve({ ...r, id: 7 }));
    const ds = {
      transaction: vi.fn((cb: (manager: any) => Promise<any>) =>
        cb({
          getRepository: (entity: unknown) =>
            entity === RouteOrmEntity
              ? { save: routeSave }
              : { delete: stopDelete, save: vi.fn() },
        }),
      ),
    } as unknown as DataSource;

    const saved = await buildDao(createMockQueryBuilder(), ds).save(
      new Route({
        name: 'Nueva',
        zoneId: 1,
        dayOfWeek: DayOfWeek.TUESDAY,
        frequency: RouteFrequency.WEEKLY,
        startDate: new Date('2026-11-03'),
      }),
    );

    expect(routeSave.mock.calls[0][0]).not.toHaveProperty('id');
    expect(stopDelete).not.toHaveBeenCalled();
    expect(saved.id).toBe(7);
    expect(saved.stops).toEqual([]);
  });
});
