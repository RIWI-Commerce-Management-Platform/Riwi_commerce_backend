import { describe, expect, it, vi } from 'vitest';
import { AddRouteStopUseCase } from './add-route-stop.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
import {
  RouteClientReaderPort,
  RouteClientDetails,
} from './ports/route-client-reader.port.js';
import {
  RouteDistanceCalculatorPort,
  RouteMetricsResult,
} from './ports/route-distance-calculator.port.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('AddRouteStopUseCase', () => {
  const createRoute = () =>
    new Route({
      id: 1,
      name: 'Ruta 1',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
    });

  const mockClient: RouteClientDetails = {
    id: 101,
    commercialName: 'Supermercado El Sol',
    address: 'Calle 72 # 54-10',
    municipality: 'Barranquilla',
    zoneId: 1,
    latitude: 10.998,
    longitude: -74.805,
    isActive: true,
  };

  const createMockRepo = (route = createRoute()): RouteRepository => ({
    findById: vi.fn().mockResolvedValue(route),
    findByNameAndZone: vi.fn(),
    findPaginated: vi.fn(),
    save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    delete: vi.fn(),
  });

  const createMockClientReader = (
    client = mockClient,
  ): RouteClientReaderPort => ({
    findById: vi.fn().mockResolvedValue(client),
    findByIds: vi.fn().mockResolvedValue([client]),
  });

  const createMockDistanceCalculator = (): RouteDistanceCalculatorPort => ({
    calculateMetrics: vi.fn().mockResolvedValue({
      totalDistanceKm: 12.5,
      estimatedDurationMinutes: 75,
    } as RouteMetricsResult),
  });

  it('should add a stop to the route and calculate metrics', async () => {
    const route = createRoute();
    const repo = createMockRepo(route);
    const clientReader = createMockClientReader();
    const distanceCalc = createMockDistanceCalculator();

    const useCase = new AddRouteStopUseCase(repo, clientReader, distanceCalc);

    const result = await useCase.execute(1, {
      clientId: 101,
      suggestedTime: '09:00:00',
      estimatedDurationMinutes: 40,
    });

    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].clientId).toBe(101);
    expect(result.stops[0].visitOrder).toBe(1);
    expect(result.estimatedDurationMinutes).toBe(40);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw RouteNotFoundError if route does not exist', async () => {
    const repo = createMockRepo();
    vi.mocked(repo.findById).mockResolvedValueOnce(null);
    const useCase = new AddRouteStopUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    await expect(useCase.execute(999, { clientId: 101 })).rejects.toThrow(
      RouteNotFoundError,
    );
  });

  it('should throw UnauthorizedZoneError if regional director manages different zone', async () => {
    const repo = createMockRepo();
    const useCase = new AddRouteStopUseCase(
      repo,
      createMockClientReader(),
      createMockDistanceCalculator(),
    );

    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 2,
    };

    await expect(useCase.execute(1, { clientId: 101 }, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });

  it('should throw error if client does not exist', async () => {
    const repo = createMockRepo();
    const clientReader = createMockClientReader();
    vi.mocked(clientReader.findById).mockResolvedValueOnce(null);

    const useCase = new AddRouteStopUseCase(
      repo,
      clientReader,
      createMockDistanceCalculator(),
    );

    await expect(useCase.execute(1, { clientId: 999 })).rejects.toThrow(
      'Client with id 999 was not found',
    );
  });

  it('should throw error if client belongs to a different zone', async () => {
    const repo = createMockRepo();
    const clientReader = createMockClientReader({
      ...mockClient,
      zoneId: 3, // different zone!
    });

    const useCase = new AddRouteStopUseCase(
      repo,
      clientReader,
      createMockDistanceCalculator(),
    );

    await expect(useCase.execute(1, { clientId: 101 })).rejects.toThrow(
      'belongs to zone 3, but route belongs to zone 1',
    );
  });

  it('should recalculate distance with 2 stops', async () => {
    const route = createRoute();
    route.addStop(101);

    const secondClient: RouteClientDetails = {
      ...mockClient,
      id: 102,
      latitude: 11.002,
      longitude: -74.81,
    };

    const repo = createMockRepo(route);
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn().mockResolvedValue(secondClient),
      findByIds: vi.fn().mockResolvedValue([mockClient, secondClient]),
    };
    const distanceCalc = createMockDistanceCalculator();

    const useCase = new AddRouteStopUseCase(repo, clientReader, distanceCalc);

    const result = await useCase.execute(1, { clientId: 102 });

    expect(result.stops).toHaveLength(2);
    expect(distanceCalc.calculateMetrics).toHaveBeenCalled();
    expect(result.totalDistanceKm).toBe(12.5);
  });
});
