import { Injectable } from '@nestjs/common';
import {
  AdvisorMetricsRow,
  CommercialMetrics,
  IndicatorRange,
  IndicatorsDao,
  ZoneMetricsRow,
} from '../domain/indicators.dao.js';
import { effectiveness } from './effectiveness.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

export type WithEffectiveness<T extends CommercialMetrics> = T & {
  /** Completed visits over scheduled visits, in %. */
  effectiveness: number;
};

export interface IndicatorsInput extends IndicatorRange {
  zoneId?: number;
}

const withEffectiveness = <T extends CommercialMetrics>(
  row: T,
): WithEffectiveness<T> => ({
  ...row,
  effectiveness: effectiveness(row.completedVisits, row.scheduledVisits),
});

/**
 * HU-40: effectiveness and quoted value per advisor and per zone, for the
 * "Indicators" page charts. A regional director only sees their zone.
 */
@Injectable()
export class GetIndicatorsUseCase {
  constructor(private readonly indicatorsDao: IndicatorsDao) {}

  async byAdvisor(
    input: IndicatorsInput,
    actor?: CurrentActor,
  ): Promise<WithEffectiveness<AdvisorMetricsRow>[]> {
    const zoneId = scopeForActor(actor).zoneId ?? input.zoneId;
    const rows = await this.indicatorsDao.metricsByAdvisor(input, zoneId);
    return rows.map(withEffectiveness);
  }

  async byZone(
    input: IndicatorsInput,
    actor?: CurrentActor,
  ): Promise<WithEffectiveness<ZoneMetricsRow>[]> {
    const zoneId = scopeForActor(actor).zoneId ?? input.zoneId;
    const rows = await this.indicatorsDao.metricsByZone(input, zoneId);
    return rows.map(withEffectiveness);
  }
}
