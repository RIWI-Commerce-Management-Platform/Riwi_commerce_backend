import { describe, expect, it, vi } from 'vitest';
import { UpdateRouteDraftUseCase } from './update-route-draft.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
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

  const createMockRepository = (): RouteRepository => ({
    findById: vi.fn().mockResolvedValue(existingRoute),
    findByNameAndZone: vi.fn().mockResolvedValue(null),
    findPaginated: vi.fn(),
    save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    delete: vi.fn(),
  });

  it('should update route general info successfully', async () => {
    const repository = createMockRepository();
    const useCase = new UpdateRouteDraftUseCase(repository);

    const result = await useCase.execute(1, {
      name: 'Ruta Actualizada',
      description: 'Nueva descripción',
      dayOfWeek: DayOfWeek.TUESDAY,
    });

    expect(result.name).toBe('Ruta Actualizada');
    expect(result.description).toBe('Nueva descripción');
    expect(result.dayOfWeek).toBe(DayOfWeek.TUESDAY);
  });

  it('should throw RouteNotFoundError if route does not exist', async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findById).mockResolvedValueOnce(null);
    const useCase = new UpdateRouteDraftUseCase(repository);

    await expect(useCase.execute(999, { name: 'Test' })).rejects.toThrow(
      RouteNotFoundError,
    );
  });

  it('should throw UnauthorizedZoneError if regional director manages different zone', async () => {
    const repository = createMockRepository();
    const useCase = new UpdateRouteDraftUseCase(repository);

    const actor = {
      id: 'dir-1',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 2,
    };

    await expect(useCase.execute(1, { name: 'Test' }, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });

  it('should throw RouteNameAlreadyExistsError if new name collides in same zone', async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findByNameAndZone).mockResolvedValueOnce(
      new Route({
        id: 2, // different route
        name: 'Ruta Existente',
        zoneId: 1,
        dayOfWeek: DayOfWeek.MONDAY,
        frequency: RouteFrequency.WEEKLY,
        startDate: new Date(),
      }),
    );
    const useCase = new UpdateRouteDraftUseCase(repository);

    await expect(
      useCase.execute(1, { name: 'Ruta Existente' }),
    ).rejects.toThrow(RouteNameAlreadyExistsError);
  });
});
