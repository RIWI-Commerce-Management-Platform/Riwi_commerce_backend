import { describe, expect, it } from 'vitest';
import { RouteMapper } from './route.mapper.js';
import { Route } from '../domain/route.entity.js';
import { RouteStop } from '../domain/route-stop.entity.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteOrmEntity } from './route.orm-entity.js';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';

describe('RouteMapper', () => {
  it('should map from RouteOrmEntity to Domain Route', () => {
    const stopOrm = new RouteStopOrmEntity();
    stopOrm.id = 1;
    stopOrm.routeId = 10;
    stopOrm.clientId = 101;
    stopOrm.visitOrder = 1;
    stopOrm.suggestedTime = '09:00:00';
    stopOrm.estimatedDurationMinutes = 30;
    stopOrm.createdAt = new Date('2026-10-23');

    const routeOrm = new RouteOrmEntity();
    routeOrm.id = 10;
    routeOrm.name = 'Ruta Norte';
    routeOrm.description = 'Descripción';
    routeOrm.zoneId = 1;
    routeOrm.advisorId = 5;
    routeOrm.dayOfWeek = 'MONDAY';
    routeOrm.frequency = 'WEEKLY';
    routeOrm.startTime = '08:00:00';
    routeOrm.endTime = '17:00:00';
    routeOrm.startDate = new Date('2026-10-26');
    routeOrm.endDate = new Date('2026-11-26');
    routeOrm.status = 'ASSIGNED';
    routeOrm.totalDistanceKm = 14.5;
    routeOrm.estimatedDurationMinutes = 120;
    routeOrm.isActive = true;
    routeOrm.createdAt = new Date('2026-10-23');
    routeOrm.updatedAt = new Date('2026-10-23');
    routeOrm.stops = [stopOrm];

    const domain = RouteMapper.toDomain(routeOrm);

    expect(domain.id).toBe(10);
    expect(domain.name).toBe('Ruta Norte');
    expect(domain.dayOfWeek).toBe(DayOfWeek.MONDAY);
    expect(domain.frequency).toBe(RouteFrequency.WEEKLY);
    expect(domain.status).toBe(RouteStatus.ASSIGNED);
    expect(domain.totalDistanceKm).toBe(14.5);
    expect(domain.stops).toHaveLength(1);
    expect(domain.stops[0].clientId).toBe(101);
  });

  it('should map from Domain Route to RouteOrmEntity', () => {
    const domain = new Route({
      id: 10,
      name: 'Ruta Sur',
      zoneId: 2,
      dayOfWeek: DayOfWeek.FRIDAY,
      frequency: RouteFrequency.BIWEEKLY,
      startDate: new Date('2026-10-26'),
      stops: [
        new RouteStop({
          id: 5,
          clientId: 201,
          visitOrder: 1,
        }),
      ],
    });

    const orm = RouteMapper.toOrm(domain);

    expect(orm.id).toBe(10);
    expect(orm.name).toBe('Ruta Sur');
    expect(orm.zoneId).toBe(2);
    expect(orm.dayOfWeek).toBe('FRIDAY');
    expect(orm.frequency).toBe('BIWEEKLY');
    expect(orm.stops).toHaveLength(1);
    expect(orm.stops[0].clientId).toBe(201);
    expect(orm.stops[0].route).toBe(orm);
  });
});
