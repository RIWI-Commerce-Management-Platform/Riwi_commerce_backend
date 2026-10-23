import { Injectable } from '@nestjs/common';
import {
  RouteDistanceCalculatorPort,
  RouteMetricsResult,
  RouteWaypoint,
} from '../application/ports/route-distance-calculator.port.js';

/**
 * Adaptador de infraestructura que implementa `RouteDistanceCalculatorPort` (HU-22).
 *
 * En este adaptador calculo la distancia geodésica acumulada entre paradas consecutivas
 * utilizando la fórmula de Haversine, complementada con un factor de corrección de trazado
 * vial urbano (1.3x) y una velocidad promedio estimada de 25 km/h para ciudades colombianas,
 * sumando además los tiempos de atención pactados en cada cliente.
 */
@Injectable()
export class HaversineRouteDistanceCalculatorAdapter implements RouteDistanceCalculatorPort {
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly URBAN_DETOUR_FACTOR = 1.3; // Factor de curvatura de vías urbanas
  private readonly AVERAGE_URBAN_SPEED_KMH = 25; // Velocidad promedio de desplazamiento

  /**
   * Con este método calculo los kilómetros totales y minutos estimados de todo el recorrido.
   */
  async calculateMetrics(
    waypoints: RouteWaypoint[],
    totalStopDurationMinutes = 0,
  ): Promise<RouteMetricsResult> {
    if (waypoints.length < 2) {
      return {
        totalDistanceKm: 0,
        estimatedDurationMinutes: totalStopDurationMinutes,
      };
    }

    let rawDistanceKm = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      rawDistanceKm += this._haversineDistance(
        p1.latitude,
        p1.longitude,
        p2.latitude,
        p2.longitude,
      );
    }

    // Aplico el factor de corrección para aproximar la red de calles reales
    const realisticDistanceKm = rawDistanceKm * this.URBAN_DETOUR_FACTOR;
    const drivingTimeMinutes =
      (realisticDistanceKm / this.AVERAGE_URBAN_SPEED_KMH) * 60;

    const totalMinutes = Math.round(
      drivingTimeMinutes + totalStopDurationMinutes,
    );
    const roundedDistanceKm = Math.round(realisticDistanceKm * 100) / 100;

    return {
      totalDistanceKm: roundedDistanceKm,
      estimatedDurationMinutes: totalMinutes,
    };
  }

  /**
   * Fórmula matemática de Haversine para obtener la distancia geodésica sobre la superficie terrestre.
   */
  private _haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (angle: number) => (angle * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }
}
