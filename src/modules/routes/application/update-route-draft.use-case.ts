import { Injectable } from '@nestjs/common';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * General data of an existing route that can be updated.
 */
export interface UpdateRouteDraftCommand {
  name?: string;
  description?: string | null;
  zoneId?: number;
  dayOfWeek?: DayOfWeek;
  frequency?: RouteFrequency;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: Date;
  endDate?: Date | null;
}

/**
 * Updates the general data of a route (HU-17, HU-21). A regional director
 * can't touch or move routes outside their zone, and a new name must be
 * unique within the target zone.
 */
@Injectable()
export class UpdateRouteDraftUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(
    routeId: number,
    command: UpdateRouteDraftCommand,
    actor?: AuthActor,
  ): Promise<Route> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundError(routeId);
    }

    // A regional director can only manage routes in their zone
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
      if (command.zoneId && actor.zoneId && command.zoneId !== actor.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, command.zoneId);
      }
    }

    // A new name or zone must keep the name unique within the zone
    const targetZoneId = command.zoneId ?? route.zoneId;
    if (
      command.name &&
      (command.name !== route.name || targetZoneId !== route.zoneId)
    ) {
      const existing = await this.routeRepository.findByNameAndZone(
        command.name,
        targetZoneId,
      );
      if (existing && existing.id !== route.id) {
        throw new RouteNameAlreadyExistsError(command.name, targetZoneId);
      }
    }

    route.updateGeneralInfo(command);

    return await this.routeRepository.save(route);
  }
}
