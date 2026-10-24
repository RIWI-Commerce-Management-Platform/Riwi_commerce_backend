import { describe, expect, it, vi } from 'vitest';
import { RoutesController } from './routes.controller.js';
import { Route } from '../domain/route.entity.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { RouteHasNoStopsError } from '../domain/errors/route-has-no-stops.error.js';
import { ClientAlreadyInRouteError } from '../domain/errors/client-already-in-route.error.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('RoutesController', () => {
  const mockRoute = new Route({
    id: 1,
    name: 'Ruta 1',
    zoneId: 1,
    dayOfWeek: DayOfWeek.MONDAY,
    frequency: RouteFrequency.WEEKLY,
    startDate: new Date('2026-10-26'),
    status: RouteStatus.DRAFT,
  });

  const mockUser = {
    id: 'user-1',
    role: UserRole.DIRECTOR_REGIONAL,
    zoneId: 1,
  };

  const createMockUseCases = () => ({
    createRouteDraftUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
    updateRouteDraftUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
    addRouteStopUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
    removeRouteStopUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
    reorderRouteStopsUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
    assignRouteAdvisorUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
    calculateRouteMetricsUseCase: {
      execute: vi
        .fn()
        .mockResolvedValue({
          totalDistanceKm: 10,
          estimatedDurationMinutes: 60,
        }),
    } as any,
    findRoutesUseCase: {
      execute: vi.fn().mockResolvedValue({
        data: [mockRoute],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
    } as any,
    getRouteByIdUseCase: {
      execute: vi.fn().mockResolvedValue({
        route: mockRoute,
        stops: [],
      }),
    } as any,
    toggleRouteStatusUseCase: {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as any,
  });

  it('should create route draft successfully', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const dto = {
      name: 'Ruta 1',
      zoneId: 1,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: '2026-10-26',
    };

    const result = await controller.createDraft(dto as any, mockUser);
    expect(result.id).toBe(1);
    expect(result.name).toBe('Ruta 1');
  });

  it('should translate RouteNameAlreadyExistsError to ConflictException', async () => {
    const useCases = createMockUseCases();
    vi.mocked(useCases.createRouteDraftUseCase.execute).mockRejectedValueOnce(
      new RouteNameAlreadyExistsError('Ruta 1', 1),
    );

    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    await expect(
      controller.createDraft({ name: 'Ruta 1', zoneId: 1 } as any, mockUser),
    ).rejects.toThrow(ConflictException);
  });

  it('should translate UnauthorizedZoneError to ForbiddenException', async () => {
    const useCases = createMockUseCases();
    vi.mocked(useCases.createRouteDraftUseCase.execute).mockRejectedValueOnce(
      new UnauthorizedZoneError(1, 2),
    );

    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    await expect(
      controller.createDraft({ name: 'Ruta 1', zoneId: 2 } as any, mockUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should get route by id and return enriched details', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.getById(1, mockUser);
    expect(result.id).toBe(1);
    expect(useCases.getRouteByIdUseCase.execute).toHaveBeenCalledWith(
      1,
      expect.any(Object),
    );
  });

  it('should translate RouteNotFoundError to NotFoundException', async () => {
    const useCases = createMockUseCases();
    vi.mocked(useCases.getRouteByIdUseCase.execute).mockRejectedValueOnce(
      new RouteNotFoundError(999),
    );

    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    await expect(controller.getById(999, mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should add stop and handle ClientAlreadyInRouteError with BadRequestException', async () => {
    const useCases = createMockUseCases();
    vi.mocked(useCases.addRouteStopUseCase.execute).mockRejectedValueOnce(
      new ClientAlreadyInRouteError(101, 1),
    );

    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    await expect(
      controller.addStop(1, { clientId: 101 }, mockUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('should assign advisor and handle RouteHasNoStopsError with BadRequestException', async () => {
    const useCases = createMockUseCases();
    vi.mocked(useCases.assignRouteAdvisorUseCase.execute).mockRejectedValueOnce(
      new RouteHasNoStopsError(1),
    );

    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    await expect(
      controller.assignAdvisor(1, { advisorId: 5 }, mockUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('should calculate metrics preview', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.calculateMetrics({
      clientIds: [101, 102],
    });

    expect(result.totalDistanceKm).toBe(10);
    expect(result.estimatedDurationMinutes).toBe(60);
  });

  it('should find paginated routes', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.findPaginated(
      { parsedPage: 1, parsedLimit: 10 } as any,
      mockUser,
    );

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should toggle route status', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.toggleStatus(1, mockUser);
    expect(result.id).toBe(1);
    expect(useCases.toggleRouteStatusUseCase.execute).toHaveBeenCalledWith(
      1,
      expect.any(Object),
    );
  });

  it('should update route general info', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.updateDraft(
      1,
      { name: 'Nuevo Nombre' },
      mockUser,
    );
    expect(result.id).toBe(1);
  });

  it('should remove stop', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.removeStop(1, 101, mockUser);
    expect(result.id).toBe(1);
  });

  it('should reorder stops', async () => {
    const useCases = createMockUseCases();
    const controller = new RoutesController(
      useCases.createRouteDraftUseCase,
      useCases.updateRouteDraftUseCase,
      useCases.addRouteStopUseCase,
      useCases.removeRouteStopUseCase,
      useCases.reorderRouteStopsUseCase,
      useCases.assignRouteAdvisorUseCase,
      useCases.calculateRouteMetricsUseCase,
      useCases.findRoutesUseCase,
      useCases.getRouteByIdUseCase,
      useCases.toggleRouteStatusUseCase,
    );

    const result = await controller.reorderStops(
      1,
      { orderedClientIds: [102, 101] },
      mockUser,
    );
    expect(result.id).toBe(1);
  });
});
