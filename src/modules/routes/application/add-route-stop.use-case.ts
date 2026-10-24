import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { RouteClientReaderPort } from './ports/route-client-reader.port.js';
import {
  RouteDistanceCalculatorPort,
  RouteWaypoint,
} from './ports/route-distance-calculator.port.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Input to add a stop to a route (HU-18).
 */
export interface AddRouteStopCommand {
  clientId: number;
  suggestedTime?: string | null;
  estimatedDurationMinutes?: number;
}

/**
 * Adds a client as a stop of a route (HU-18, HU-19, HU-22). The client must
 * belong to the route's zone; the stop goes last, and the distance and time
 * metrics are recalculated before saving.
 */
@Injectable()
export class AddRouteStopUseCase {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly clientReader: RouteClientReaderPort,
    private readonly distanceCalculator: RouteDistanceCalculatorPort,
  ) {}

  async execute(
    routeId: number,
    command: AddRouteStopCommand,
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

    const client = await this.clientReader.findById(command.clientId);
    if (!client) {
      throw new Error(`Client with id ${command.clientId} was not found`);
    }

    // The client must be in the route's zone
    if (client.zoneId !== route.zoneId) {
      throw new Error(
        `Client ${client.id} belongs to zone ${client.zoneId}, but route belongs to zone ${route.zoneId}`,
      );
    }

    route.addStop(
      command.clientId,
      command.suggestedTime,
      command.estimatedDurationMinutes,
    );

    // Distance and estimated time (HU-22)
    await this._recalculateRouteMetrics(route);

    return await this.routeRepository.save(route);
  }

  private async _recalculateRouteMetrics(route: Route): Promise<void> {
    const stops = route.stops;
    if (stops.length < 2) {
      const singleStopDuration =
        stops.length === 1 ? stops[0].estimatedDurationMinutes : 0;
      route.updateMetrics(0, singleStopDuration);
      return;
    }

    const clientIds = stops.map((s) => s.clientId);
    const clients = await this.clientReader.findByIds(clientIds);
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const waypoints: RouteWaypoint[] = [];
    let totalStopAttentionMinutes = 0;

    for (const stop of stops) {
      totalStopAttentionMinutes += stop.estimatedDurationMinutes;
      const client = clientMap.get(stop.clientId);
      if (client?.latitude != null && client.longitude != null) {
        waypoints.push({
          latitude: client.latitude,
          longitude: client.longitude,
        });
      }
    }

    const metrics = await this.distanceCalculator.calculateMetrics(
      waypoints,
      totalStopAttentionMinutes,
    );

    route.updateMetrics(
      metrics.totalDistanceKm,
      metrics.estimatedDurationMinutes,
    );
  }
}
