import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { VisitSchedulerPort } from './ports/visit-scheduler.port.js';
import { RouteAdvisorReaderPort } from './ports/route-advisor-reader.port.js';
import { InvalidRouteAdvisorError } from '../domain/errors/invalid-route-advisor.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Assigns a route to an advisor and schedules its visits (HU-20, wizard
 * step 3). `assignAdvisor()` requires at least one stop and moves the route
 * to ASSIGNED; VisitSchedulerPort then creates the visits in the advisor's
 * agenda (epic E4) for the route's day and frequency. Only an active advisor
 * can receive a route (HU-07).
 */
@Injectable()
export class AssignRouteAdvisorUseCase {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly visitScheduler: VisitSchedulerPort,
    private readonly advisorReader: RouteAdvisorReaderPort,
  ) {}

  async execute(
    routeId: number,
    advisorId: number,
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
    }

    if (!(await this.advisorReader.isActiveAdvisor(advisorId))) {
      throw new InvalidRouteAdvisorError(advisorId);
    }

    route.assignAdvisor(advisorId);

    const savedRoute = await this.routeRepository.save(route);

    // Schedule the visits in the advisor's agenda (E4)
    await this.visitScheduler.scheduleVisitsForRoute({
      routeId: savedRoute.id!,
      advisorId,
      dayOfWeek: savedRoute.dayOfWeek,
      frequency: savedRoute.frequency,
      startDate: savedRoute.startDate,
      endDate: savedRoute.endDate,
      stops: savedRoute.stops.map((stop) => ({
        clientId: stop.clientId,
        visitOrder: stop.visitOrder,
        suggestedTime: stop.suggestedTime,
        estimatedDurationMinutes: stop.estimatedDurationMinutes,
      })),
    });

    return savedRoute;
  }
}
