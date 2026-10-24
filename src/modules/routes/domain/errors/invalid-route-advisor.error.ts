/**
 * Thrown when a route is assigned to a user that is not an advisor or whose
 * advisor account is inactive (HU-07, HU-20).
 */
export class InvalidRouteAdvisorError extends Error {
  constructor(advisorId: number) {
    super(`User ${advisorId} is not an active advisor`);
    this.name = 'InvalidRouteAdvisorError';
  }
}
