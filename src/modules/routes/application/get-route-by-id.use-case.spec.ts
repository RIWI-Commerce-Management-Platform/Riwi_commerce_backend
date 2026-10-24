import { describe, expect, it, vi } from 'vitest';
import { GetRouteByIdUseCase } from './get-route-by-id.use-case.js';
import { RouteRepository } from '../domain/route.repository.js';
import {
  RouteClientReaderPort,
  RouteClientDetails,
} from './ports/route-client-reader.port.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('GetRouteByIdUseCase', () => {
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

  const clientDetails: RouteClientDetails = {
    id: 101,
    commercialName: 'Tienda La Esquina',
    address: 'Carrera 43 # 80-15',
    municipality: 'Barranquilla',
    zoneId: 1,
    latitude: 10.985,
    longitude: -74.795,
    isActive: true,
  };

  it('should return enriched route details with client coordinates for map rendering', async () => {
    const route = createRouteWithStops();
    const repo: RouteRepository = {
      findById: vi.fn().mockResolvedValue(route),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn(),
      findByIds: vi.fn().mockResolvedValue([clientDetails]),
    };

    const useCase = new GetRouteByIdUseCase(repo, clientReader);
    const result = await useCase.execute(1);

    expect(result.route.id).toBe(1);
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].client).toEqual(clientDetails);
    expect(result.stops[0].client?.latitude).toBe(10.985);
  });

  it('should throw RouteNotFoundError if route does not exist', async () => {
    const repo: RouteRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn(),
      findByIds: vi.fn(),
    };

    const useCase = new GetRouteByIdUseCase(repo, clientReader);
    await expect(useCase.execute(999)).rejects.toThrow(RouteNotFoundError);
  });

  it('should throw UnauthorizedZoneError if regional director manages different zone', async () => {
    const route = createRouteWithStops();
    const repo: RouteRepository = {
      findById: vi.fn().mockResolvedValue(route),
      findByNameAndZone: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn(),
      findByIds: vi.fn(),
    };

    const useCase = new GetRouteByIdUseCase(repo, clientReader);
    const actor = {
      id: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 88,
    };

    await expect(useCase.execute(1, actor)).rejects.toThrow(
      UnauthorizedZoneError,
    );
  });
});
