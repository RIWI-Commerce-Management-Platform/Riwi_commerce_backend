/**
 * Error de dominio lanzado cuando intento asignar una ruta a un asesor comercial
 * pero aún no le he agregado ninguna parada (clientes a visitar).
 * 
 * Regla de negocio: No tiene sentido despachar a un asesor con una ruta vacía.
 */
export class RouteHasNoStopsError extends Error {
  constructor(routeId?: number) {
    const target = routeId ? `Route ${routeId}` : 'The route';
    super(`${target} cannot be assigned because it has no stops`);
    this.name = 'RouteHasNoStopsError';
  }
}
