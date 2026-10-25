import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteDao } from '../domain/route.dao.js';
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
 * Reorders the stops of a route (HU-18, HU-19, HU-22), from the frontend's
 * drag-and-drop or the map, and recalculates the metrics for the new order.
 */
@Injectable()
export class ReorderRouteStopsUseCase {
  constructor(
    private readonly routeDao: RouteDao,
    private readonly clientReader: RouteClientReaderPort,
    private readonly distanceCalculator: RouteDistanceCalculatorPort,
  ) {}

  async execute(
    routeId: number,
    orderedClientIds: number[],
    actor?: AuthActor,
  ): Promise<Route> {
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

    route.reorderStops(orderedClientIds);

    await this._recalculateRouteMetrics(route);

    return await this.routeDao.save(route);
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
