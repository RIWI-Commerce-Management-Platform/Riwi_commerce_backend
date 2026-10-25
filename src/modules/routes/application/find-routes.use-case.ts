import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteFilterCriteria } from '../domain/route-filter.criteria.js';
import { RouteDao } from '../domain/route.dao.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Paginated, filtered route list (HU-21). The role limits the result
 * (HU-06): a regional director only sees their zone and an advisor only the
 * routes assigned to them. An admin can filter freely.
 */
@Injectable()
export class FindRoutesUseCase {
  constructor(private readonly routeDao: RouteDao) {}

  async execute(
    criteria: RouteFilterCriteria,
    actor?: AuthActor,
  ): Promise<PaginatedResult<Route>> {
    const scopedCriteria: RouteFilterCriteria = { ...criteria };

    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId) {
        scopedCriteria.zoneId = actor.zoneId;
      }
    }
    if (actor && actor.role === UserRole.ASESOR) {
      scopedCriteria.advisorId = actor.id;
    }

    return await this.routeDao.findPaginated(scopedCriteria);
  }
}
