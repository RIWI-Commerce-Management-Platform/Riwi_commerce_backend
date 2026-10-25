import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto.js';
import { DashboardKpisResponseDto } from './dto/dashboard-kpis-response.dto.js';
import type { GetDashboardKpisUseCase } from '../application/use-cases/get-dashboard-kpis.use-case.js';
import type { DashboardKpis } from '../domain/dashboard-kpis.js';
import type { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

const kpis: DashboardKpis = {
  weekStart: '2026-10-19',
  weekEnd: '2026-10-25',
  territoryId: 1,
  scheduledVisits: 24,
  completedVisits: 19,
  effectiveness: 79.2,
  quotedAmount: '215450000.00',
  closedOrders: 8,
  revenue: null,
};

describe('DashboardController (HU-35)', () => {
  it('passes the filters and the actor to the use case', async () => {
    const actor = { id: 1, role: UserRole.ADMIN, zoneId: null };
    const execute = vi.fn().mockResolvedValue(kpis);
    const currentActor = { extract: vi.fn().mockResolvedValue(actor) };
    const controller = new DashboardController(
      { execute } as unknown as GetDashboardKpisUseCase,
      currentActor as unknown as CurrentActorProvider,
    );
    const filters = Object.assign(new DashboardFiltersDto(), {
      weekStart: '2026-10-19',
      territoryId: 1,
    });

    const result = await controller.getKpis(filters, {} as never);

    expect(execute).toHaveBeenCalledExactlyOnceWith(
      { weekStart: '2026-10-19', territoryId: 1 },
      actor,
    );
    expect(result).toBeInstanceOf(DashboardKpisResponseDto);
    expect(result).toEqual({ ...kpis });
  });

  it('is restricted to admins and regional directors', () => {
    const handler = Object.getOwnPropertyDescriptor(
      DashboardController.prototype,
      'getKpis',
    )?.value as object;

    expect(Reflect.getMetadata(GUARDS_METADATA, DashboardController)).toEqual([
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      UserRole.ADMIN,
      UserRole.DIRECTOR_REGIONAL,
    ]);
  });
});
