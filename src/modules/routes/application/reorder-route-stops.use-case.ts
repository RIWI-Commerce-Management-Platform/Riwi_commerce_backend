import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { RouteClientReaderPort } from './ports/route-client-reader.port.js';
import { RouteDistanceCalculatorPort, RouteWaypoint } from './ports/route-distance-calculator.port.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Caso de uso: Reordenar las paradas de la ruta comercial (HU-18, HU-19 y HU-22).
 * 
 * En este caso de uso:
 * 1. Verifico la existencia de la ruta y los permisos del Director Regional.
 * 2. Aplico el nuevo orden secuencial en el agregado Route (drag-and-drop o reordenamiento del mapa).
 * 3. Recalculo las métricas de recorrido basándome en el nuevo trayecto secuencial.
 * 4. Persisto la ruta con las paradas reordenadas para reflejarlas en el mapa interactivo (Leaflet).
 */
@Injectable()
export class ReorderRouteStopsUseCase {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly clientReader: RouteClientReaderPort,
    private readonly distanceCalculator: RouteDistanceCalculatorPort,
  ) {}

  async execute(
    routeId: number,
    orderedClientIds: number[],
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

    // 2. Aplico el reordenamiento en el dominio
    route.reorderStops(orderedClientIds);

    // 3. Recalculo la distancia y duración estimada con la nueva secuencia
    await this._recalculateRouteMetrics(route);

    // 4. Guardo los cambios
    return await this.routeRepository.save(route);
  }

  private async _recalculateRouteMetrics(route: Route): Promise<void> {
    const stops = route.stops;
    if (stops.length < 2) {
      const singleStopDuration = stops.length === 1 ? stops[0].estimatedDurationMinutes : 0;
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

    route.updateMetrics(metrics.totalDistanceKm, metrics.estimatedDurationMinutes);
  }
}
