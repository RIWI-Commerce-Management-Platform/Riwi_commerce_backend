/**
 * Thrown when adding a client that is already a stop of the route. A client
 * can't appear twice in the same route.
 */
export class ClientAlreadyInRouteError extends Error {
  constructor(clientId: number, routeId?: number) {
    const routeMsg = routeId ? ` in route ${routeId}` : '';
    super(`Client with id ${clientId} is already included${routeMsg}`);
    this.name = 'ClientAlreadyInRouteError';
  }
}
