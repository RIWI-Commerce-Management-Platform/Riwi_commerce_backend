import { describe, expect, it, vi } from 'vitest';
import { ToggleRouteStatusUseCase } from './toggle-route-status.use-case.js';
import { RouteDao } from '../domain/route.dao.js';
import { Route } from '../domain/route.entity.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('ToggleRouteStatusUseCase', () => {
  const createRoute = () =>
    new Route({
      id: 1,
      name: 'Ruta 1',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
    });

  it('should deactivate an active route', async () => {
    const route = createRoute();
    const dao: RouteDao = {
      findById: vi.fn().mockResolvedValue(route),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
      delete: vi.fn(),
    };

    const useCase = new ToggleRouteStatusUseCase(dao);
    const result = await useCase.execute(1);

    expect(result.isActive).toBe(false);
    expect(result.status).toBe(RouteStatus.INACTIVE);
  });

  it('should reactivate an inactive route', async () => {
    const route = createRoute();
    route.deactivate();

    const dao: RouteDao = {
      findById: vi.fn().mockResolvedValue(route),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
      delete: vi.fn(),
    };

    const useCase = new ToggleRouteStatusUseCase(dao);
    const result = await useCase.execute(1);

    expect(result.isActive).toBe(true);
    expect(result.status).toBe(RouteStatus.DRAFT);
  });

  it('should throw RouteNotFoundError if route does not exist', async () => {
    const dao: RouteDao = {
      findById: vi.fn().mockResolvedValue(null),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new ToggleRouteStatusUseCase(dao);
    await expect(useCase.execute(999)).rejects.toThrow(RouteNotFoundError);
  });

  it('should throw UnauthorizedZoneError if regional director manages different zone', async () => {
    const route = createRoute();
    const dao: RouteDao = {
      findById: vi.fn().mockResolvedValue(route),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new ToggleRouteStatusUseCase(dao);
    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 77,
    };

    await expect(useCase.execute(1, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });
});
