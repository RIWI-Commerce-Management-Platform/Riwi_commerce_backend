/**
 * Thrown when a regional director creates, changes or reads a route outside
 * their zone. Each director is limited to their assigned territory.
 */
export class UnauthorizedZoneError extends Error {
  constructor(userZoneId: number, targetZoneId: number) {
    super(
      `Regional director assigned to zone ${userZoneId} cannot manage routes in zone ${targetZoneId}`,
    );
    this.name = 'UnauthorizedZoneError';
  }
}
