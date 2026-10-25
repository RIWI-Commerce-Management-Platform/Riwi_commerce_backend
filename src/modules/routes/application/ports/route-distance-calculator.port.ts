/**
 * A coordinate used to compute distances and times.
 */
export interface RouteWaypoint {
  latitude: number;
  longitude: number;
}

/**
 * Computed metrics of a route.
 */
export interface RouteMetricsResult {
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
}

/**
 * Port that estimates travel distance and time (HU-22), so use cases don't
 * depend on how it's computed (Haversine formula or the OSRM API).
 */
export abstract class RouteDistanceCalculatorPort {
  /**
   * Total kilometers and estimated minutes for an ordered list of points.
   */
  abstract calculateMetrics(
    waypoints: RouteWaypoint[],
    totalStopDurationMinutes?: number,
  ): Promise<RouteMetricsResult>;
}
