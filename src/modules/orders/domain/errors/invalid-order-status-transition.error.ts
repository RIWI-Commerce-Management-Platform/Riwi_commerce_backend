import { OrderStatus } from '../order-status.enum.js';

export class InvalidOrderStatusTransitionError extends Error {
  constructor(currentStatus: OrderStatus, requestedStatus: OrderStatus) {
    super(
      `Cannot transition order from status '${currentStatus}' to '${requestedStatus}'.`,
    );
    this.name = 'InvalidOrderStatusTransitionError';
  }
}
