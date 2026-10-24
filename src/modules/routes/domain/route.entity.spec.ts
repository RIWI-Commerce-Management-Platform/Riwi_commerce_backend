import { describe, expect, it } from 'vitest';
import { Route } from './route.entity.js';
import { RouteStatus } from './route-status.enum.js';
import { DayOfWeek } from './day-of-week.enum.js';
import { RouteFrequency } from './route-frequency.enum.js';
import { RouteHasNoStopsError } from './errors/route-has-no-stops.error.js';
import { ClientAlreadyInRouteError } from './errors/client-already-in-route.error.js';
import { ClientNotInRouteError } from './errors/client-not-in-route.error.js';
import { InvalidStopOrderError } from './errors/invalid-stop-order.error.js';

describe('Route Domain Entity', () => {
  const baseRouteProps = {
    name: 'Ruta Norte 1',
    description: 'Ruta de prueba en Barranquilla Norte',
    zoneId: 1,
    dayOfWeek: DayOfWeek.MONDAY,
    frequency: RouteFrequency.WEEKLY,
    startDate: new Date('2026-10-26'),
  };

  it('should initialize a valid route in DRAFT status by default', () => {
    const route = new Route(baseRouteProps);

    expect(route.name).toBe('Ruta Norte 1');
    expect(route.zoneId).toBe(1);
    expect(route.status).toBe(RouteStatus.DRAFT);
    expect(route.advisorId).toBeNull();
    expect(route.stops).toHaveLength(0);
    expect(route.isActive).toBe(true);
    expect(route.createdAt).toBeInstanceOf(Date);
  });

  it('should reject creation with empty or whitespace-only name', () => {
    expect(() => new Route({ ...baseRouteProps, name: '   ' })).toThrow(
      'Route name cannot be empty',
    );
  });

  it('should reject creation with invalid zoneId', () => {
    expect(() => new Route({ ...baseRouteProps, zoneId: 0 })).toThrow(
      'Zone ID must be a valid positive integer',
    );
  });

  it('should add stops and assign sequential visit orders', () => {
    const route = new Route(baseRouteProps);

    const stop1 = route.addStop(101, '09:00:00', 30);
    const stop2 = route.addStop(102, '10:00:00', 45);

    expect(route.stops).toHaveLength(2);
    expect(stop1.visitOrder).toBe(1);
    expect(stop1.clientId).toBe(101);
    expect(stop2.visitOrder).toBe(2);
    expect(stop2.clientId).toBe(102);
  });

  it('should throw ClientAlreadyInRouteError when adding a duplicate client', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);

    expect(() => route.addStop(101)).toThrow(ClientAlreadyInRouteError);
  });

  it('should remove a stop and re-index remaining stops consecutively', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);
    route.addStop(102);
    route.addStop(103);

    route.removeStop(102);

    expect(route.stops).toHaveLength(2);
    expect(route.stops[0].clientId).toBe(101);
    expect(route.stops[0].visitOrder).toBe(1);
    expect(route.stops[1].clientId).toBe(103);
    expect(route.stops[1].visitOrder).toBe(2);
  });

  it('should throw ClientNotInRouteError when removing a non-existent client', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);

    expect(() => route.removeStop(999)).toThrow(ClientNotInRouteError);
  });

  it('should reorder stops correctly based on clientIds array', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);
    route.addStop(102);
    route.addStop(103);

    route.reorderStops([103, 101, 102]);

    expect(route.stops[0].clientId).toBe(103);
    expect(route.stops[0].visitOrder).toBe(1);
    expect(route.stops[1].clientId).toBe(101);
    expect(route.stops[1].visitOrder).toBe(2);
    expect(route.stops[2].clientId).toBe(102);
    expect(route.stops[2].visitOrder).toBe(3);
  });

  it('should throw InvalidStopOrderError when reordering with mismatched length or invalid clients', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);
    route.addStop(102);

    expect(() => route.reorderStops([101])).toThrow(InvalidStopOrderError);
    expect(() => route.reorderStops([101, 999])).toThrow(InvalidStopOrderError);
  });

  it('should assign advisor and transition to ASSIGNED status when route has stops', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);

    route.assignAdvisor(5);

    expect(route.advisorId).toBe(5);
    expect(route.status).toBe(RouteStatus.ASSIGNED);
  });

  it('should throw RouteHasNoStopsError when assigning advisor to empty route', () => {
    const route = new Route(baseRouteProps);

    expect(() => route.assignAdvisor(5)).toThrow(RouteHasNoStopsError);
  });

  it('should throw when assigning an inactive route or invalid advisor ID', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);
    route.deactivate();

    expect(() => route.assignAdvisor(5)).toThrow(
      'Cannot assign an inactive route',
    );

    route.activate();
    expect(() => route.assignAdvisor(0)).toThrow(
      'Advisor ID must be a valid positive integer',
    );
  });

  it('should update route metrics', () => {
    const route = new Route(baseRouteProps);

    route.updateMetrics(18.5, 240);

    expect(route.totalDistanceKm).toBe(18.5);
    expect(route.estimatedDurationMinutes).toBe(240);
  });

  it('should throw if updating metrics with negative values', () => {
    const route = new Route(baseRouteProps);

    expect(() => route.updateMetrics(-1, 100)).toThrow(
      'totalDistanceKm cannot be negative',
    );
    expect(() => route.updateMetrics(10, -5)).toThrow(
      'estimatedDurationMinutes cannot be negative',
    );
  });

  it('should update general info', () => {
    const route = new Route(baseRouteProps);

    route.updateGeneralInfo({
      name: 'Ruta Norte Modificada',
      description: 'New description',
      dayOfWeek: DayOfWeek.FRIDAY,
    });

    expect(route.name).toBe('Ruta Norte Modificada');
    expect(route.description).toBe('New description');
    expect(route.dayOfWeek).toBe(DayOfWeek.FRIDAY);
  });

  it('should handle deactivate and activate lifecycle', () => {
    const route = new Route(baseRouteProps);
    route.addStop(101);
    route.assignAdvisor(5);

    route.deactivate();
    expect(route.isActive).toBe(false);
    expect(route.status).toBe(RouteStatus.INACTIVE);

    route.activate();
    expect(route.isActive).toBe(true);
    expect(route.status).toBe(RouteStatus.ASSIGNED);
  });
});
