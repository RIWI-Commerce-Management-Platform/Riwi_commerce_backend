/**
 * Error de dominio lanzado cuando busco una ruta por su ID y no existe en la base de datos.
 */
export class RouteNotFoundError extends Error {
  constructor(id: number) {
    super(`Route with id ${id} not found`);
    this.name = 'RouteNotFoundError';
  }
}
