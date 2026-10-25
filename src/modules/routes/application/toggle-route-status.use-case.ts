import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteDao } from '../domain/route.dao.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Toggles a route between active and inactive (HU-21). Deactivating is a
 * soft delete (`is_active = false`, status INACTIVE).
 */
@Injectable()
export class ToggleRouteStatusUseCase {
  constructor(private readonly routeDao: RouteDao) {}

  async execute(routeId: number, actor?: AuthActor): Promise<Route> {
    const route = await this.routeDao.findById(routeId);
    if (!route) {
      throw new RouteNotFoundError(routeId);
    }

    // A regional director can only manage routes in their zone
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
    }

    if (route.isActive) {
      route.deactivate();
    } else {
      route.activate();
    }

    return await this.routeDao.save(route);
  }
}
