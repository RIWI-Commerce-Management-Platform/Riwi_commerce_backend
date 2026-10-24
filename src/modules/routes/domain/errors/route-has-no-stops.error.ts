/**
 * Thrown when assigning a route that has no stops yet: an advisor can't be
 * sent out with an empty route.
 */
export class RouteHasNoStopsError extends Error {
  constructor(routeId?: number) {
    const target = routeId ? `Route ${routeId}` : 'The route';
    super(`${target} cannot be assigned because it has no stops`);
    this.name = 'RouteHasNoStopsError';
  }
}
