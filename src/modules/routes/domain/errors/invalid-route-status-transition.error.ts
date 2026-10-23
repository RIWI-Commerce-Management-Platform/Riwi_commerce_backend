import { RouteStatus } from '../route-status.enum.js';

/**
 * Error de dominio lanzado cuando se intenta realizar una transición de estado ilegal en la ruta.
 */
export class InvalidRouteStatusTransitionError extends Error {
  constructor(from: RouteStatus, to: RouteStatus) {
    super(`Cannot transition route status from ${from} to ${to}`);
    this.name = 'InvalidRouteStatusTransitionError';
  }
}
