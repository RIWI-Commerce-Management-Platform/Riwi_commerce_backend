/**
 * Thrown when creating or renaming a route with a name already used in the
 * same zone.
 */
export class RouteNameAlreadyExistsError extends Error {
  constructor(name: string, zoneId: number) {
    super(`Route with name '${name}' already exists in zone ${zoneId}`);
    this.name = 'RouteNameAlreadyExistsError';
  }
}
