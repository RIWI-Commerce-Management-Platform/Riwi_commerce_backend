
import { describe, it, expect, vi } from 'vitest';

import { DashboardController } from './dashboard.controller.js';
import { GetDashboardKpisUseCase } from '../application/use-cases/get-dashboard-kpis.use-case.js';

import type {
  DashboardKpis,
  DashboardFilters,
} from '../domain/dashboard-kpis.js';

describe('DashboardController', () => {
  it('should pass filters to the use case and return KPIs', async () => {
    const filters: DashboardFilters = {
      territoryId: 'zone-1',
      weekStart: '2026-10-19',
    };

    const expectedKpis: DashboardKpis = {
      scheduledVisits: 24,
      completedVisits: 19,
      effectiveness: 79.17,
      quotedAmount: 215450000,
      closedOrders: 8,
      revenue: 128760000,
    };

    const executeMock = vi.fn().mockResolvedValue(expectedKpis);

    const useCase = {
      execute: executeMock,
    } as unknown as GetDashboardKpisUseCase;

    const controller = new DashboardController(useCase);

    const result = await controller.getKpis(filters);

    expect(executeMock).toHaveBeenCalledExactlyOnceWith(filters);
    expect(result).toEqual(expectedKpis);
  });
});
