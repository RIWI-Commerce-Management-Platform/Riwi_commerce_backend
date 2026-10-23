import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Route } from '../domain/route.entity.js';
import { RouteFilterCriteria } from '../domain/route-filter.criteria.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteOrmEntity } from './route.orm-entity.js';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';
import { RouteMapper } from './route.mapper.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/**
 * Implementación de persistencia TypeORM para el repositorio RouteRepository.
 *
 * En mi repositorio gestiono de forma transaccional el agregado Route junto con
 * todas sus paradas (RouteStop), garantizando atomicidad y consistencia en la base de datos PostgreSQL.
 */
@Injectable()
export class TypeOrmRouteRepository implements RouteRepository {
  constructor(
    @InjectRepository(RouteOrmEntity)
    private readonly routeOrmRepository: Repository<RouteOrmEntity>,
    @InjectRepository(RouteStopOrmEntity)
    private readonly stopOrmRepository: Repository<RouteStopOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Con este método busco una ruta por su ID cargando todas sus paradas ordenadas.
   */
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

  /**
   * Con este método busco si ya existe una ruta con el mismo nombre en la zona indicada.
   */
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

  /**
   * Con este método obtengo un listado paginado aplicando filtros dinámicos (HU-21).
   */
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

  /**
   * Con este método persisto atómicamente la ruta y sincronizo sus paradas en PostgreSQL.
   */
  async save(route: Route): Promise<Route> {
    return await this.dataSource.transaction(async (manager) => {
      const routeOrmRepo = manager.getRepository(RouteOrmEntity);
      const stopOrmRepo = manager.getRepository(RouteStopOrmEntity);

      const orm = RouteMapper.toOrm(route);

      // 1. Guardo la entidad principal de ruta
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

      // 2. Si ya existía, sincronizo las paradas eliminando las anteriores y reinsertando
      if (route.id) {
        await stopOrmRepo.delete({ routeId: savedOrm.id });
      }

      // 3. Guardo las paradas con su orden secuencial
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

  /**
   * Con este método elimino físicamente una ruta si se requiriera.
   */
  async delete(id: number): Promise<void> {
    await this.routeOrmRepository.delete(id);
  }
}
