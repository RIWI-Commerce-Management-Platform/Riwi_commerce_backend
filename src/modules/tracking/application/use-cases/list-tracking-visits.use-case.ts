import { Injectable } from '@nestjs/common';
import { TrackingDao } from '../../domain/dao/tracking.dao.js';
import type {
  TrackingFilters,
  TrackingVisitsPage,
} from '../../domain/tracking-visit.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../../shared/auth/domain/current-actor.provider.js';

/**
 * HU-37: the visits of a week for the "Seguimiento de rutas y visitas"
 * table. A regional director only sees their zone, like HU-40.
 */
@Injectable()
export class ListTrackingVisitsUseCase {
  constructor(private readonly trackingDao: TrackingDao) {}

  execute(
    filters: TrackingFilters,
    actor?: CurrentActor,
  ): Promise<TrackingVisitsPage> {
    return this.trackingDao.findVisits({
      ...filters,
      territoryId: scopeForActor(actor).zoneId ?? filters.territoryId,
    });
  }
}
