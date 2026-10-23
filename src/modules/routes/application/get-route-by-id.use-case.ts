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
 * Estructura de parada enriquecida con información del cliente y sus coordenadas
 * para renderizar directamente en el mapa Leaflet de OpenStreetMap (HU-19).
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
 * Detalle completo de la ruta con paradas enriquecidas para el mapa.
 */
export interface EnrichedRouteDetails {
  route: Route;
  stops: EnrichedRouteStop[];
}

/**
 * Caso de uso: Obtener el detalle de una ruta comercial por su ID (HU-19 y HU-21).
 *
 * En este caso de uso:
 * 1. Busco la ruta en el repositorio y valido que exista.
 * 2. Valido que el Director Regional tenga autorización sobre la zona.
 * 3. Enriquezco cada parada con el nombre comercial, dirección y coordenadas
 *    del cliente para que el frontend pueda pintar los marcadores numerados
 *    y la polilínea del recorrido en el mapa interactivo (HU-19).
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

    // 1. Verifico la seguridad de zona
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
    }

    // 2. Consulto los clientes de las paradas para enriquecer con coordenadas
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
