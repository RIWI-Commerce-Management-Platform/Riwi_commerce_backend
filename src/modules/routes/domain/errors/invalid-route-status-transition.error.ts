import { RouteStatus } from '../route-status.enum.js';

/**
 * Thrown on an illegal route status transition.
 */
export class InvalidRouteStatusTransitionError extends Error {
  constructor(from: RouteStatus, to: RouteStatus) {
    super(`Cannot transition route status from ${from} to ${to}`);
    this.name = 'InvalidRouteStatusTransitionError';
  }
}
