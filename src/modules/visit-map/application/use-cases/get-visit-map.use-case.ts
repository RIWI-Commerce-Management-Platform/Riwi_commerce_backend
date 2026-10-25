import { Injectable } from '@nestjs/common';
import { VisitMapDao } from '../../domain/dao/visit-map.dao.js';
import {
  MapStatus,
  mapStatusOf,
  VisitMap,
  VisitMapFilters,
} from '../../domain/visit-map.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../../shared/auth/domain/current-actor.provider.js';

/**
 * HU-36: the visits of a day with their marker category. A regional
 * director only sees their zone, like HU-40.
 */
@Injectable()
export class GetVisitMapUseCase {
  constructor(private readonly visitMapDao: VisitMapDao) {}

  async execute(
    filters: VisitMapFilters,
    actor?: CurrentActor,
  ): Promise<VisitMap> {
    const day = await this.visitMapDao.findDayVisits({
      ...filters,
      territoryId: scopeForActor(actor).zoneId ?? filters.territoryId,
    });

    const counts = Object.fromEntries(
      Object.values(MapStatus).map((status) => [status, 0]),
    ) as Record<MapStatus, number>;
    const data = day.rows.map((row) => {
      const mapStatus = mapStatusOf(row.status, row.orderGenerated);
      counts[mapStatus] += 1;
      return { ...row, mapStatus };
    });

    return {
      date: day.date,
      total: data.length,
      withoutLocation: data.filter((marker) => marker.location === null).length,
      counts,
      data,
    };
  }
}
