
import { describe, it, expect, vi } from 'vitest';

import { GetDashboardKpisUseCase } from './get-dashboard-kpis.use-case.js';

import type { DashboardDao } from '../../domain/dao/dashboard.dao.js';

import type { DashboardFilters, DashboardKpis,} from '../../domain/dashboard-kpis.js';

describe('GetDashboardKpisUseCase', () => {
  it('should return KPIs using the provided filters', async () => {
    // Arrange: prepare test data
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

    const getKpisMock = vi.fn().mockResolvedValue(expectedKpis);

    const dashboardDao = {
      getKpis: getKpisMock,
    } as unknown as DashboardDao;

    const useCase = new GetDashboardKpisUseCase(dashboardDao);

    // Act: execute the use case
    const result = await useCase.execute(filters);

    // Assert: verify the result and DAO call
    expect(result).toEqual(expectedKpis);
    expect(getKpisMock).toHaveBeenCalledExactlyOnceWith(filters);
  });
});
