import { describe, expect, it, vi } from 'vitest';
import { UpdateRouteDraftUseCase } from './update-route-draft.use-case.js';
import { RouteDao } from '../domain/route.dao.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('UpdateRouteDraftUseCase', () => {
  const existingRoute = new Route({
    id: 1,
    name: 'Ruta 1',
    zoneId: 1,
    dayOfWeek: DayOfWeek.MONDAY,
    frequency: RouteFrequency.WEEKLY,
    startDate: new Date('2026-10-26'),
  });

  const createMockDao = (): RouteDao => ({
    findById: vi.fn().mockResolvedValue(existingRoute),
    findByNameAndZone: vi.fn().mockResolvedValue(null),
    findPaginated: vi.fn(),
    save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    delete: vi.fn(),
  });

  it('should update route general info successfully', async () => {
    const dao = createMockDao();
    const useCase = new UpdateRouteDraftUseCase(dao);

    const result = await useCase.execute(1, {
      name: 'Ruta Actualizada',
      description: 'New description',
      dayOfWeek: DayOfWeek.TUESDAY,
    });

    expect(result.name).toBe('Ruta Actualizada');
    expect(result.description).toBe('New description');
    expect(result.dayOfWeek).toBe(DayOfWeek.TUESDAY);
  });

  it('should throw RouteNotFoundError if route does not exist', async () => {
    const dao = createMockDao();
    vi.mocked(dao.findById).mockResolvedValueOnce(null);
    const useCase = new UpdateRouteDraftUseCase(dao);

    await expect(useCase.execute(999, { name: 'Test' })).rejects.toThrow(
      RouteNotFoundError,
    );
  });

  it('should throw UnauthorizedZoneError if regional director manages different zone', async () => {
    const dao = createMockDao();
    const useCase = new UpdateRouteDraftUseCase(dao);

    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 2,
    };

    await expect(useCase.execute(1, { name: 'Test' }, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });

  it('should throw RouteNameAlreadyExistsError if new name collides in same zone', async () => {
    const dao = createMockDao();
    vi.mocked(dao.findByNameAndZone).mockResolvedValueOnce(
      new Route({
        id: 2, // different route
        name: 'Ruta Existente',
        zoneId: 1,
        dayOfWeek: DayOfWeek.MONDAY,
        frequency: RouteFrequency.WEEKLY,
        startDate: new Date(),
      }),
    );
    const useCase = new UpdateRouteDraftUseCase(dao);

    await expect(
      useCase.execute(1, { name: 'Ruta Existente' }),
    ).rejects.toThrow(RouteNameAlreadyExistsError);
  });

  it('should forbid a director from moving a route to another zone', async () => {
    const useCase = new UpdateRouteDraftUseCase(createMockDao());

    await expect(
      useCase.execute(
        1,
        { zoneId: 2 },
        { id: 1, role: UserRole.DIRECTOR_REGIONAL, zoneId: 1 },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedZoneError);
  });
});
