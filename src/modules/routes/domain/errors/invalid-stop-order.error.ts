/**
 * Thrown when the list sent to reorder the stops doesn't match the route's
 * clients exactly (missing or unknown stops).
 */
export class InvalidStopOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStopOrderError';
  }
}
