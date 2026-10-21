import type { DashboardFilters, DashboardKpis} from '../dashboard-kpis.js';

export abstract class DashboardDao {
  abstract getKpis(
    filters: DashboardFilters,
  ): Promise<DashboardKpis>;
}
