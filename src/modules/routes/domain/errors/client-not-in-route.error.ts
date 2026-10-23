/**
 * Error de dominio lanzado cuando intento remover una parada de un cliente que no
 * pertenece a esta ruta.
 */
export class ClientNotInRouteError extends Error {
  constructor(clientId: number, routeId?: number) {
    const routeMsg = routeId ? ` in route ${routeId}` : '';
    super(`Client with id ${clientId} was not found${routeMsg}`);
    this.name = 'ClientNotInRouteError';
  }
}
