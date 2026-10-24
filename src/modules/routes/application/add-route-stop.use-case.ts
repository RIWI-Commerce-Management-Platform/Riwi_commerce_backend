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
 * Parámetros para agregar una parada a una ruta comercial (HU-18).
 */
export interface AddRouteStopCommand {
  clientId: number;
  suggestedTime?: string | null;
  estimatedDurationMinutes?: number;
}

/**
 * Caso de uso: Agregar un cliente como parada a una ruta (HU-18, HU-19 y HU-22).
 *
 * En este caso de uso:
 * 1. Verifico la existencia de la ruta y los permisos territoriales del Director Regional.
 * 2. Consulto los datos del cliente a través de mi puerto de lectura (RouteClientReaderPort).
 * 3. Valido que el cliente pertenezca a la misma zona territorial de la ruta.
 * 4. Agrego la parada a la ruta respetando la secuencia numérica de visita.
 * 5. Recalculo automáticamente las métricas de distancia en km y tiempo estimado de viaje.
 * 6. Persisto la ruta actualizada.
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

    // 1. Verifico la seguridad de zona
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
    }

    // 2. Consulto los datos del cliente mediante el puerto
    const client = await this.clientReader.findById(command.clientId);
    if (!client) {
      throw new Error(`Client with id ${command.clientId} was not found`);
    }

    // 3. Valido coherencia territorial: el cliente debe estar en la misma zona de la ruta
    if (client.zoneId !== route.zoneId) {
      throw new Error(
        `Client ${client.id} belongs to zone ${client.zoneId}, but route belongs to zone ${route.zoneId}`,
      );
    }

    // 4. Agrego la parada en mi modelo de dominio
    route.addStop(
      command.clientId,
      command.suggestedTime,
      command.estimatedDurationMinutes,
    );

    // 5. Recalculo distancia y tiempo estimado (HU-22)
    await this._recalculateRouteMetrics(route);

    // 6. Guardo y retorno la ruta
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
