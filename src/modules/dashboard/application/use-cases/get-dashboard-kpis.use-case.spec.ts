import { describe, expect, it, vi } from 'vitest';
import { GetDashboardKpisUseCase } from './get-dashboard-kpis.use-case.js';
import type { DashboardDao } from '../../domain/dao/dashboard.dao.js';
import type { WeeklyMetrics } from '../../domain/dashboard-kpis.js';
import { UserRole } from '../../../auth/domain/user-role.enum.js';

const metrics: WeeklyMetrics = {
  weekStart: '2026-10-19',
  weekEnd: '2026-10-25',
  scheduledVisits: 24,
  completedVisits: 19,
  quotedAmount: '215450000.50',
  closedOrders: 8,
};

const buildDao = (overrides: Partial<WeeklyMetrics> = {}) => ({
  getWeeklyMetrics: vi.fn().mockResolvedValue({ ...metrics, ...overrides }),
});

const build = (dao = buildDao()) =>
  new GetDashboardKpisUseCase(dao as unknown as DashboardDao);

const admin = { id: 1, role: UserRole.ADMIN, zoneId: null };
const director = { id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 7 };

describe('GetDashboardKpisUseCase (HU-35)', () => {
  it('returns the six KPIs with effectiveness and no revenue', async () => {
    const dao = buildDao();

    const kpis = await build(dao).execute(
      { weekStart: '2026-10-21', territoryId: 3 },
      admin,
    );

    expect(kpis).toEqual({
      ...metrics,
      territoryId: 3,
      effectiveness: 79.2,
      revenue: null,
    });
    expect(dao.getWeeklyMetrics).toHaveBeenCalledExactlyOnceWith({
      weekStart: '2026-10-21',
      territoryId: 3,
    });
  });

  it('returns null effectiveness for a week without visits', async () => {
    const kpis = await build(
      buildDao({ scheduledVisits: 0, completedVisits: 0 }),
    ).execute({}, admin);

    expect(kpis.effectiveness).toBeNull();
  });

  it('lets an admin see every territory', async () => {
    const dao = buildDao();

    const kpis = await build(dao).execute({}, admin);

    expect(kpis.territoryId).toBeNull();
    expect(dao.getWeeklyMetrics).toHaveBeenCalledWith({
      weekStart: undefined,
      territoryId: undefined,
    });
  });

  it("forces a regional director's own zone, whatever they ask for", async () => {
    const dao = buildDao();

    const kpis = await build(dao).execute({ territoryId: 2 }, director);

    expect(kpis.territoryId).toBe(7);
    expect(dao.getWeeklyMetrics).toHaveBeenCalledWith({
      weekStart: undefined,
      territoryId: 7,
    });
  });
});
