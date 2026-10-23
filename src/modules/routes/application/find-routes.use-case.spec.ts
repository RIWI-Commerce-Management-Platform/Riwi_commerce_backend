import { describe, expect, it, vi } from 'vitest';
import { FindRoutesUseCase } from './find-routes.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('FindRoutesUseCase', () => {
  const routes = [
    new Route({
      id: 1,
      name: 'Ruta 1',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date(),
    }),
  ];

  it('should list routes with pagination', async () => {
    const repo: RouteRepository = {
      findById: vi.fn(),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn().mockResolvedValue({
        data: routes,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new FindRoutesUseCase(repo);
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should enforce zone filter for regional directors', async () => {
    const repo: RouteRepository = {
      findById: vi.fn(),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn().mockResolvedValue({ data: [], meta: {} as any }),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new FindRoutesUseCase(repo);
    const actor = {
      id: 'dir-1',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 3,
    };

    await useCase.execute({ zoneId: 1 }, actor);

    expect(repo.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ zoneId: 3 }),
    );
  });
});
