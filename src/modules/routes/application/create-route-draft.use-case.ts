import { Injectable } from '@nestjs/common';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { Route } from '../domain/route.entity.js';
import { RouteDao } from '../domain/route.dao.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Input to create a route draft (wizard step 1, HU-17).
 */
export interface CreateRouteDraftCommand {
  name: string;
  description?: string | null;
  zoneId: number;
  dayOfWeek: DayOfWeek;
  frequency: RouteFrequency;
  startTime?: string | null;
  endTime?: string | null;
  startDate: Date;
  endDate?: Date | null;
}

/**
 * Creates a route in DRAFT (wizard step 1, HU-17) so progress can be saved.
 * A regional director can only create routes in their zone, and the name
 * must be unique within the zone.
 */
@Injectable()
export class CreateRouteDraftUseCase {
  constructor(private readonly routeDao: RouteDao) {}

  async execute(
    command: CreateRouteDraftCommand,
    actor?: AuthActor,
  ): Promise<Route> {
    // A regional director can only create routes in their zone
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== command.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, command.zoneId);
      }
    }

    const existing = await this.routeDao.findByNameAndZone(
      command.name,
      command.zoneId,
    );
    if (existing) {
      throw new RouteNameAlreadyExistsError(command.name, command.zoneId);
    }

    const route = new Route({
      name: command.name,
      description: command.description,
      zoneId: command.zoneId,
      dayOfWeek: command.dayOfWeek,
      frequency: command.frequency,
      startTime: command.startTime,
      endTime: command.endTime,
      startDate: command.startDate,
      endDate: command.endDate,
      status: RouteStatus.DRAFT,
    });

    return await this.routeDao.save(route);
  }
}
