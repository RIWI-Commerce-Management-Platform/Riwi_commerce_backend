/**
 * Thrown when no route exists with the given id.
 */
export class RouteNotFoundError extends Error {
  constructor(id: number) {
    super(`Route with id ${id} not found`);
    this.name = 'RouteNotFoundError';
  }
}
