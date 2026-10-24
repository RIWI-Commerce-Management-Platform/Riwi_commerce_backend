import { CurrentActor } from '../../../../shared/auth/domain/current-actor.provider.js';
import { OrderStatus } from '../../domain/order-status.enum.js';

export interface ChangeOrderStatusCommand {
  orderId: number;
  newStatus: OrderStatus;
  actorId: number;
  /** With an actor, an order outside their scope is not found (HU-06). */
  actor?: CurrentActor;
}
