import { Order } from './order.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import { ActorScope } from '../../../shared/auth/domain/current-actor.provider.js';

export interface ListOrdersFilter {
  clientId?: number;
  advisorId?: number;
  zoneId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export abstract class OrderDao {
  abstract save(order: Order): Promise<Order>;
  /** With a scope, an order outside it is reported as not found (HU-06). */
  abstract findById(id: number, scope?: ActorScope): Promise<Order | null>;
  abstract findByQuoteId(quoteId: number): Promise<Order | null>;
  abstract findByOrderNumber(orderNumber: string): Promise<Order | null>;
  abstract generateNextOrderNumber(): Promise<string>;
  abstract findPaginated(
    filter: ListOrdersFilter,
  ): Promise<PaginatedResult<Order>>;
}
