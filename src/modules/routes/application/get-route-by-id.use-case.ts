import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import {
  RouteClientReaderPort,
  RouteClientDetails,
} from './ports/route-client-reader.port.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * A stop with its client's data and coordinates, ready to draw on the
 * Leaflet/OpenStreetMap map (HU-19).
 */
export interface EnrichedRouteStop {
  id?: number;
  clientId: number;
  visitOrder: number;
  suggestedTime: string | null;
  estimatedDurationMinutes: number;
  client: RouteClientDetails | null;
}

/**
 * Route detail with the stops enriched for the map.
 */
export interface EnrichedRouteDetails {
  route: Route;
  stops: EnrichedRouteStop[];
}

/**
 * Route detail by id (HU-19, HU-21). Each stop carries the client's
 * commercial name, address and coordinates so the frontend can draw the
 * numbered markers and the route line on the map. A regional director only
 * sees their zone and an advisor only their own routes (HU-06).
 */
@Injectable()
export class GetRouteByIdUseCase {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly clientReader: RouteClientReaderPort,
  ) {}

  async execute(
    routeId: number,
    actor?: AuthActor,
  ): Promise<EnrichedRouteDetails> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundError(routeId);
    }

    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
    }
    // An advisor can't tell apart a route of someone else from a missing one
    if (
      actor &&
      actor.role === UserRole.ASESOR &&
      route.advisorId !== actor.id
    ) {
      throw new RouteNotFoundError(routeId);
    }

    const clientIds = route.stops.map((s) => s.clientId);
    const clients =
      clientIds.length > 0 ? await this.clientReader.findByIds(clientIds) : [];
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const enrichedStops: EnrichedRouteStop[] = route.stops.map((stop) => ({
      id: stop.id,
      clientId: stop.clientId,
      visitOrder: stop.visitOrder,
      suggestedTime: stop.suggestedTime,
      estimatedDurationMinutes: stop.estimatedDurationMinutes,
      client: clientMap.get(stop.clientId) ?? null,
    }));

    return {
      route,
      stops: enrichedStops,
    };
  }
}
