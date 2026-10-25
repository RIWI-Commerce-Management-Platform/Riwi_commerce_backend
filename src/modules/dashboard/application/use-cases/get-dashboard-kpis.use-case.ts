import { Injectable } from '@nestjs/common';
import { DashboardDao } from '../../domain/dao/dashboard.dao.js';
import type {
  DashboardFilters,
  DashboardKpis,
} from '../../domain/dashboard-kpis.js';
import { effectiveness } from '../../../indicators/application/effectiveness.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../../shared/auth/domain/current-actor.provider.js';

/**
 * HU-35: the six KPI cards of a week. A regional director only sees their
 * zone, like the HU-40 indicators. Revenue stays null: there is no
 * invoicing data source yet.
 */
@Injectable()
export class GetDashboardKpisUseCase {
  constructor(private readonly dashboardDao: DashboardDao) {}

  async execute(
    filters: DashboardFilters,
    actor?: CurrentActor,
  ): Promise<DashboardKpis> {
    const territoryId = scopeForActor(actor).zoneId ?? filters.territoryId;
    const metrics = await this.dashboardDao.getWeeklyMetrics({
      weekStart: filters.weekStart,
      territoryId,
    });

    return {
      ...metrics,
      territoryId: territoryId ?? null,
      effectiveness:
        metrics.scheduledVisits > 0
          ? effectiveness(metrics.completedVisits, metrics.scheduledVisits)
          : null,
      revenue: null,
    };
  }
}
