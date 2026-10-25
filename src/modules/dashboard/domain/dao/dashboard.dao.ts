import type { DashboardFilters, WeeklyMetrics } from '../dashboard-kpis.js';

/** Read-only queries for the weekly KPI dashboard (HU-35). */
export abstract class DashboardDao {
  abstract getWeeklyMetrics(filters: DashboardFilters): Promise<WeeklyMetrics>;
}
