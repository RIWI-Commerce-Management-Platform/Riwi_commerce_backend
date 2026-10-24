/**
 * Error de dominio lanzado cuando intento agregar un cliente que ya se encuentra
 * registrado como parada dentro de la misma ruta.
 *
 * Regla de negocio: En un mismo recorrido de ruta no se duplican clientes.
 */
export class ClientAlreadyInRouteError extends Error {
  constructor(clientId: number, routeId?: number) {
    const routeMsg = routeId ? ` in route ${routeId}` : '';
    super(`Client with id ${clientId} is already included${routeMsg}`);
    this.name = 'ClientAlreadyInRouteError';
  }
}
