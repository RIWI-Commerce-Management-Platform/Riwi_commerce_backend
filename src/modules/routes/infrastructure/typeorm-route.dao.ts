import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Route } from '../domain/route.entity.js';
import { RouteFilterCriteria } from '../domain/route-filter.criteria.js';
import { RouteDao } from '../domain/route.dao.js';
import { RouteOrmEntity } from './route.orm-entity.js';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';
import { RouteMapper } from './route.mapper.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/**
 * TypeORM implementation of RouteDao. Saves the Route aggregate and
 * all of its stops in one transaction.
 */
@Injectable()
export class TypeOrmRouteDao implements RouteDao {
  constructor(
    @InjectRepository(RouteOrmEntity)
    private readonly routeOrmRepository: Repository<RouteOrmEntity>,
    @InjectRepository(RouteStopOrmEntity)
    private readonly stopOrmRepository: Repository<RouteStopOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /** Finds a route by id with its ordered stops. */
  async findById(id: number): Promise<Route | null> {
    const orm = await this.routeOrmRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.stops', 'stops')
      .where('route.id = :id', { id })
      .orderBy('stops.visit_order', 'ASC')
      .getOne();

    if (!orm) {
      return null;
    }

    return RouteMapper.toDomain(orm);
  }

  /** Finds a route with the same name in the zone. */
  async findByNameAndZone(name: string, zoneId: number): Promise<Route | null> {
    const orm = await this.routeOrmRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.stops', 'stops')
      .where('LOWER(route.name) = LOWER(:name)', { name: name.trim() })
      .andWhere('route.zone_id = :zoneId', { zoneId })
      .getOne();

    if (!orm) {
      return null;
    }

    return RouteMapper.toDomain(orm);
  }

  /** Paginated list with the optional filters (HU-21). */
  async findPaginated(
    criteria: RouteFilterCriteria,
  ): Promise<PaginatedResult<Route>> {
    const page = criteria.page && criteria.page > 0 ? criteria.page : 1;
    const limit =
      criteria.limit && criteria.limit > 0 ? Math.min(criteria.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const query = this.routeOrmRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.stops', 'stops');

    if (criteria.zoneId !== undefined) {
      query.andWhere('route.zone_id = :zoneId', { zoneId: criteria.zoneId });
    }

    if (criteria.advisorId !== undefined) {
      query.andWhere('route.advisor_id = :advisorId', {
        advisorId: criteria.advisorId,
      });
    }

    if (criteria.status !== undefined) {
      query.andWhere('route.status = :status', { status: criteria.status });
    }

    if (criteria.dayOfWeek !== undefined) {
      query.andWhere('route.day_of_week = :dayOfWeek', {
        dayOfWeek: criteria.dayOfWeek,
      });
    }

    if (criteria.frequency !== undefined) {
      query.andWhere('route.frequency = :frequency', {
        frequency: criteria.frequency,
      });
    }

    if (criteria.isActive !== undefined) {
      query.andWhere('route.is_active = :isActive', {
        isActive: criteria.isActive,
      });
    }

    if (criteria.search) {
      query.andWhere('LOWER(route.name) LIKE LOWER(:search)', {
        search: `%${criteria.search.trim()}%`,
      });
    }

    query.orderBy('route.created_at', 'DESC').skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: items.map((orm) => RouteMapper.toDomain(orm)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /** Saves the route and syncs its stops atomically. */
  async save(route: Route): Promise<Route> {
    return await this.dataSource.transaction(async (manager) => {
      const routeOrmRepo = manager.getRepository(RouteOrmEntity);
      const stopOrmRepo = manager.getRepository(RouteStopOrmEntity);

      const orm = RouteMapper.toOrm(route);

      const savedOrm = await routeOrmRepo.save({
        ...(orm.id ? { id: orm.id } : {}),
        name: orm.name,
        description: orm.description,
        zoneId: orm.zoneId,
        advisorId: orm.advisorId,
        dayOfWeek: orm.dayOfWeek,
        frequency: orm.frequency,
        startTime: orm.startTime,
        endTime: orm.endTime,
        startDate: orm.startDate,
        endDate: orm.endDate,
        status: orm.status,
        totalDistanceKm: orm.totalDistanceKm,
        estimatedDurationMinutes: orm.estimatedDurationMinutes,
        isActive: orm.isActive,
      });

      // For an existing route, replace its stops
      if (route.id) {
        await stopOrmRepo.delete({ routeId: savedOrm.id });
      }

      if (route.stops && route.stops.length > 0) {
        const stopsToSave = route.stops.map((stopDomain) => {
          const stopOrm = RouteMapper.toStopOrm(stopDomain, savedOrm.id);
          stopOrm.routeId = savedOrm.id;
          return stopOrm;
        });
        savedOrm.stops = await stopOrmRepo.save(stopsToSave);
      } else {
        savedOrm.stops = [];
      }

      return RouteMapper.toDomain(savedOrm);
    });
  }

  /** Physically deletes a route. */
  async delete(id: number): Promise<void> {
    await this.routeOrmRepository.delete(id);
  }
}
