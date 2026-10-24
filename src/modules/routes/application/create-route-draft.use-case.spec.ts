import { describe, expect, it, vi } from 'vitest';
import { CreateRouteDraftUseCase } from './create-route-draft.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('CreateRouteDraftUseCase', () => {
  const createMockRepository = (): RouteRepository => ({
    findById: vi.fn(),
    findByNameAndZone: vi.fn().mockResolvedValue(null),
    findPaginated: vi.fn(),
    save: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    delete: vi.fn(),
  });

  const baseCommand = {
    name: 'Ruta Semanal Norte',
    description: 'Recorrido de clientes norte',
    zoneId: 1,
    dayOfWeek: DayOfWeek.MONDAY,
    frequency: RouteFrequency.WEEKLY,
    startDate: new Date('2026-10-26'),
  };

  it('should create a route draft successfully in DRAFT status', async () => {
    const repository = createMockRepository();
    const useCase = new CreateRouteDraftUseCase(repository);

    const result = await useCase.execute(baseCommand);

    expect(result.name).toBe('Ruta Semanal Norte');
    expect(result.zoneId).toBe(1);
    expect(result.status).toBe(RouteStatus.DRAFT);
    expect(result.stops).toHaveLength(0);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw RouteNameAlreadyExistsError if route name is duplicated in the same zone', async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findByNameAndZone).mockResolvedValueOnce({} as any);
    const useCase = new CreateRouteDraftUseCase(repository);

    await expect(useCase.execute(baseCommand)).rejects.toThrow(
      RouteNameAlreadyExistsError,
    );
  });

  it('should throw UnauthorizedZoneError if regional director tries to create route outside their zone', async () => {
    const repository = createMockRepository();
    const useCase = new CreateRouteDraftUseCase(repository);

    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 2, // Zone 2, but command is for Zone 1
    };

    await expect(useCase.execute(baseCommand, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });

  it('should allow admin to create route in any zone', async () => {
    const repository = createMockRepository();
    const useCase = new CreateRouteDraftUseCase(repository);

    const actor = {
      id: 2,
      role: UserRole.ADMIN,
    };

    const result = await useCase.execute(baseCommand, actor);
    expect(result.name).toBe('Ruta Semanal Norte');
  });
});
