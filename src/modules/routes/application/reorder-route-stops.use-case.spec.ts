import { describe, expect, it, vi } from 'vitest';
import { ReorderRouteStopsUseCase } from './reorder-route-stops.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteClientReaderPort } from './ports/route-client-reader.port.js';
import { RouteDistanceCalculatorPort } from './ports/route-distance-calculator.port.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('ReorderRouteStopsUseCase', () => {
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
    route.addStop(103, '11:00:00', 30);
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
      totalDistanceKm: 15,
      estimatedDurationMinutes: 120,
    }),
  });

  it('should reorder stops according to new sequence', async () => {
    const route = createRouteWithStops();
    const repo = createMockRepo(route);
    const useCase = new ReorderRouteStopsUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    const result = await useCase.execute(1, [103, 101, 102]);

    expect(result.stops[0].clientId).toBe(103);
    expect(result.stops[0].visitOrder).toBe(1);
    expect(result.stops[1].clientId).toBe(101);
    expect(result.stops[1].visitOrder).toBe(2);
    expect(result.stops[2].clientId).toBe(102);
    expect(result.stops[2].visitOrder).toBe(3);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw RouteNotFoundError if route not found', async () => {
    const repo = createMockRepo();
    vi.mocked(repo.findById).mockResolvedValueOnce(null);
    const useCase = new ReorderRouteStopsUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    await expect(useCase.execute(999, [101, 102])).rejects.toThrow(
      RouteNotFoundError,
    );
  });

  it('should throw UnauthorizedZoneError if director manages different zone', async () => {
    const repo = createMockRepo();
    const useCase = new ReorderRouteStopsUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    const actor = {
      id: 'dir-1',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 5,
    };

    await expect(useCase.execute(1, [103, 101, 102], actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });
});
