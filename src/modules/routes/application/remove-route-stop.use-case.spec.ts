import { describe, expect, it, vi } from 'vitest';
import { RemoveRouteStopUseCase } from './remove-route-stop.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteClientReaderPort } from './ports/route-client-reader.port.js';
import { RouteDistanceCalculatorPort } from './ports/route-distance-calculator.port.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('RemoveRouteStopUseCase', () => {
  const createRouteWithStops = () => {
    const route = new Route({
      id: 1,
      name: 'Ruta 1',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
    });
    route.addStop(101, '09:00:00', 30);
    route.addStop(102, '10:00:00', 30);
    return route;
  };

  const createMockRepo = (route = createRouteWithStops()): RouteRepository => ({
    findById: vi.fn().mockResolvedValue(route),
    findByNameAndZone: vi.fn(),
    findPaginated: vi.fn(),
    save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    delete: vi.fn(),
  });

  const createMockClientReader = (): RouteClientReaderPort => ({
    findById: vi.fn(),
    findByIds: vi.fn().mockResolvedValue([]),
  });

  const createMockDistanceCalculator = (): RouteDistanceCalculatorPort => ({
    calculateMetrics: vi.fn().mockResolvedValue({
      totalDistanceKm: 0,
      estimatedDurationMinutes: 30,
    }),
  });

  it('should remove a stop and re-index remaining stops', async () => {
    const route = createRouteWithStops();
    const repo = createMockRepo(route);
    const useCase = new RemoveRouteStopUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    const result = await useCase.execute(1, 101);

    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].clientId).toBe(102);
    expect(result.stops[0].visitOrder).toBe(1);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw RouteNotFoundError if route not found', async () => {
    const repo = createMockRepo();
    vi.mocked(repo.findById).mockResolvedValueOnce(null);
    const useCase = new RemoveRouteStopUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    await expect(useCase.execute(999, 101)).rejects.toThrow(RouteNotFoundError);
  });

  it('should throw UnauthorizedZoneError if director manages different zone', async () => {
    const repo = createMockRepo();
    const useCase = new RemoveRouteStopUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 99,
    };

    await expect(useCase.execute(1, 101, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });

  it('should recalculate metrics with the coordinates of the remaining stops', async () => {
    const route = createRouteWithStops();
    route.addStop(103, '11:00:00', 20);
    const clientReader = createMockClientReader();
    vi.mocked(clientReader.findByIds).mockResolvedValue([
      { id: 102, latitude: 10.96, longitude: -74.79 },
      // A client without coordinates is skipped as a waypoint
      { id: 103, latitude: null, longitude: null },
    ] as never);
    const calculator = createMockDistanceCalculator();
    vi.mocked(calculator.calculateMetrics).mockResolvedValue({
      totalDistanceKm: 4.2,
      estimatedDurationMinutes: 65,
    });
    const useCase = new RemoveRouteStopUseCase(
      createMockRepo(route),
      clientReader,
      calculator,
    );

    const result = await useCase.execute(1, 101);

    expect(clientReader.findByIds).toHaveBeenCalledWith([102, 103]);
    expect(calculator.calculateMetrics).toHaveBeenCalledWith(
      [{ latitude: 10.96, longitude: -74.79 }],
      50,
    );
    expect(result.totalDistanceKm).toBe(4.2);
    expect(result.estimatedDurationMinutes).toBe(65);
  });

  it('should reset metrics to zero when the last stop is removed', async () => {
    const route = new Route({
      id: 2,
      name: 'Ruta 2',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
    });
    route.addStop(101, '09:00:00', 30);
    const calculator = createMockDistanceCalculator();
    const useCase = new RemoveRouteStopUseCase(
      createMockRepo(route),
      createMockClientReader(),
      calculator,
    );

    const result = await useCase.execute(2, 101);

    expect(result.stops).toHaveLength(0);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.estimatedDurationMinutes).toBe(0);
    expect(calculator.calculateMetrics).not.toHaveBeenCalled();
  });

  it('should allow a director to edit a route in their own zone', async () => {
    const useCase = new RemoveRouteStopUseCase(
      createMockRepo(),
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    const result = await useCase.execute(1, 101, {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 1,
    });

    expect(result.stops).toHaveLength(1);
  });
});
