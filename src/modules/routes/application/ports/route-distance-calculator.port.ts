/**
 * Coordenada geográfica para el cálculo de distancias y tiempos.
 */
export interface RouteWaypoint {
  latitude: number;
  longitude: number;
}

/**
 * Resultado del cálculo métrico de un recorrido comercial.
 */
export interface RouteMetricsResult {
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
}

/**
 * Puerto abstracto para el cálculo de distancia y tiempo estimado de viaje (HU-22).
 * 
 * En mi arquitectura, este puerto me permite desacoplar la lógica de cálculo
 * (ya sea fórmula matemática geodésica de Haversine o consumo de la API de OSRM)
 * de mis casos de uso.
 */
export abstract class RouteDistanceCalculatorPort {
  /**
   * Con este método calculo los kilómetros totales y minutos estimados
   * a partir de una secuencia ordenada de puntos geográficos.
   */
  abstract calculateMetrics(
    waypoints: RouteWaypoint[],
    totalStopDurationMinutes?: number,
  ): Promise<RouteMetricsResult>;
}
