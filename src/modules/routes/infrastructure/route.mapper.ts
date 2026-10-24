import { Route } from '../domain/route.entity.js';
import { RouteStop } from '../domain/route-stop.entity.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteOrmEntity } from './route.orm-entity.js';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';

/**
 * Maps between the Route/RouteStop domain entities and the TypeORM
 * entities, including date and decimal conversions.
 */
export class RouteMapper {
  /** RouteOrmEntity -> Route. */
  static toDomain(orm: RouteOrmEntity): Route {
    const stops = orm.stops
      ? orm.stops
          .map((stopOrm) => this.toStopDomain(stopOrm))
          .sort((a, b) => a.visitOrder - b.visitOrder)
      : [];

    return new Route({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      zoneId: orm.zoneId,
      advisorId: orm.advisorId,
      dayOfWeek: orm.dayOfWeek as DayOfWeek,
      frequency: orm.frequency as RouteFrequency,
      startTime: orm.startTime,
      endTime: orm.endTime,
      startDate: new Date(orm.startDate),
      endDate: orm.endDate ? new Date(orm.endDate) : null,
      status: orm.status as RouteStatus,
      totalDistanceKm:
        orm.totalDistanceKm !== null && orm.totalDistanceKm !== undefined
          ? Number(orm.totalDistanceKm)
          : null,
      estimatedDurationMinutes: orm.estimatedDurationMinutes,
      stops,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  /** Route -> RouteOrmEntity. */
  static toOrm(domain: Route): RouteOrmEntity {
    const orm = new RouteOrmEntity();
    if (domain.id !== undefined) {
      orm.id = domain.id;
    }
    orm.name = domain.name;
    orm.description = domain.description;
    orm.zoneId = domain.zoneId;
    orm.advisorId = domain.advisorId;
    orm.dayOfWeek = domain.dayOfWeek;
    orm.frequency = domain.frequency;
    orm.startTime = domain.startTime;
    orm.endTime = domain.endTime;
    orm.startDate = domain.startDate;
    orm.endDate = domain.endDate;
    orm.status = domain.status;
    orm.totalDistanceKm = domain.totalDistanceKm;
    orm.estimatedDurationMinutes = domain.estimatedDurationMinutes;
    orm.isActive = domain.isActive;

    if (domain.stops) {
      orm.stops = domain.stops.map((stopDomain) => {
        const stopOrm = this.toStopOrm(stopDomain, domain.id);
        stopOrm.route = orm;
        return stopOrm;
      });
    } else {
      orm.stops = [];
    }

    return orm;
  }

  /** RouteStopOrmEntity -> RouteStop. */
  static toStopDomain(orm: RouteStopOrmEntity): RouteStop {
    return new RouteStop({
      id: orm.id,
      routeId: orm.routeId,
      clientId: orm.clientId,
      visitOrder: orm.visitOrder,
      suggestedTime: orm.suggestedTime,
      estimatedDurationMinutes: orm.estimatedDurationMinutes,
      createdAt: orm.createdAt,
    });
  }

  /** RouteStop -> RouteStopOrmEntity. */
  static toStopOrm(domain: RouteStop, routeId?: number): RouteStopOrmEntity {
    const orm = new RouteStopOrmEntity();
    if (domain.id !== undefined) {
      orm.id = domain.id;
    }
    orm.routeId = domain.routeId ?? routeId ?? 0;
    orm.clientId = domain.clientId;
    orm.visitOrder = domain.visitOrder;
    orm.suggestedTime = domain.suggestedTime;
    orm.estimatedDurationMinutes = domain.estimatedDurationMinutes;
    return orm;
  }
}
