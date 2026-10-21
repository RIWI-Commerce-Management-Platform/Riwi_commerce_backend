
import { DashboardDao } from '../../domain/dao/dashboard.dao.js';

import type { DashboardFilters, DashboardKpis,} from '../../domain/dashboard-kpis.js';

export class GetDashboardKpisUseCase {
  constructor(
    private readonly dashboardDao: DashboardDao,
  ) {}

  async execute(
    filters: DashboardFilters,
  ): Promise<DashboardKpis> {
    return this.dashboardDao.getKpis(filters);
  }
}
