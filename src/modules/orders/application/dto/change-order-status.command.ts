import { OrderStatus } from '../../domain/order-status.enum.js';

export interface ChangeOrderStatusCommand {
  orderId: number;
  newStatus: OrderStatus;
  actorId?: number;
}
