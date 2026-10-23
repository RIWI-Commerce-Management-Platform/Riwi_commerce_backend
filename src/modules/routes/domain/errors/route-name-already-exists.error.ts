/**
 * Error de dominio lanzado cuando intento crear o renombrar una ruta con un nombre que ya existe en la misma zona.
 */
export class RouteNameAlreadyExistsError extends Error {
  constructor(name: string, zoneId: number) {
    super(`Route with name '${name}' already exists in zone ${zoneId}`);
    this.name = 'RouteNameAlreadyExistsError';
  }
}
