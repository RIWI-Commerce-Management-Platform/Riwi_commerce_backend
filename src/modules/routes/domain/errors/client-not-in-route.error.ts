/**
 * Thrown when removing the stop of a client that isn't in the route.
 */
export class ClientNotInRouteError extends Error {
  constructor(clientId: number, routeId?: number) {
    const routeMsg = routeId ? ` in route ${routeId}` : '';
    super(`Client with id ${clientId} was not found${routeMsg}`);
    this.name = 'ClientNotInRouteError';
  }
}
