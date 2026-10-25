import { describe, expect, it, vi } from 'vitest';
import { AssignRouteAdvisorUseCase } from './assign-route-advisor.use-case.js';
import { RouteDao } from '../domain/route.dao.js';
import { VisitSchedulerPort } from './ports/visit-scheduler.port.js';
import { RouteAdvisorReaderPort } from './ports/route-advisor-reader.port.js';
import { InvalidRouteAdvisorError } from '../domain/errors/invalid-route-advisor.error.js';
import { Route } from '../domain/route.entity.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { RouteHasNoStopsError } from '../domain/errors/route-has-no-stops.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('AssignRouteAdvisorUseCase', () => {
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
    return route;
  };

  const createMockDao = (route = createRouteWithStops()): RouteDao => ({
    findById: vi.fn().mockResolvedValue(route),
    findByNameAndZone: vi.fn(),
    findPaginated: vi.fn(),
    save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    delete: vi.fn(),
  });

  const createMockVisitScheduler = (): VisitSchedulerPort => ({
    scheduleVisitsForRoute: vi.fn().mockResolvedValue(4),
  });

  const createMockAdvisorReader = (active = true): RouteAdvisorReaderPort => ({
    isActiveAdvisor: vi.fn().mockResolvedValue(active),
  });

  it('should assign advisor, update status to ASSIGNED, and schedule visits', async () => {
    const route = createRouteWithStops();
    const dao = createMockDao(route);
    const visitScheduler = createMockVisitScheduler();

    const useCase = new AssignRouteAdvisorUseCase(
      dao,
      visitScheduler,
      createMockAdvisorReader(),
    );

    const result = await useCase.execute(1, 10);

    expect(result.advisorId).toBe(10);
    expect(result.status).toBe(RouteStatus.ASSIGNED);
    expect(dao.save).toHaveBeenCalled();
    expect(visitScheduler.scheduleVisitsForRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId: 1,
        advisorId: 10,
        dayOfWeek: DayOfWeek.MONDAY,
        stops: expect.arrayContaining([
          expect.objectContaining({ clientId: 101, visitOrder: 1 }),
        ]),
      }),
    );
  });

  it('should throw RouteNotFoundError if route does not exist', async () => {
    const dao = createMockDao();
    vi.mocked(dao.findById).mockResolvedValueOnce(null);
    const useCase = new AssignRouteAdvisorUseCase(
      dao,
      createMockVisitScheduler(),
      createMockAdvisorReader(),
    );

    await expect(useCase.execute(999, 10)).rejects.toThrow(RouteNotFoundError);
  });

  it('should throw RouteHasNoStopsError if route has zero stops', async () => {
    const emptyRoute = new Route({
      id: 1,
      name: 'Empty route',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date(),
    });

    const dao = createMockDao(emptyRoute);
    const useCase = new AssignRouteAdvisorUseCase(
      dao,
      createMockVisitScheduler(),
      createMockAdvisorReader(),
    );

    await expect(useCase.execute(1, 10)).rejects.toThrow(RouteHasNoStopsError);
  });

  it('should throw UnauthorizedZoneError if director manages different zone', async () => {
    const dao = createMockDao();
    const useCase = new AssignRouteAdvisorUseCase(
      dao,
      createMockVisitScheduler(),
      createMockAdvisorReader(),
    );

    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 9,
    };

    await expect(useCase.execute(1, 10, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });

  it('should throw InvalidRouteAdvisorError if the advisor is not active', async () => {
    const dao = createMockDao();
    const visitScheduler = createMockVisitScheduler();
    const useCase = new AssignRouteAdvisorUseCase(
      dao,
      visitScheduler,
      createMockAdvisorReader(false),
    );

    await expect(useCase.execute(1, 10)).rejects.toThrow(
      InvalidRouteAdvisorError,
    );
    expect(dao.save).not.toHaveBeenCalled();
    expect(visitScheduler.scheduleVisitsForRoute).not.toHaveBeenCalled();
  });
});
