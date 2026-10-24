import { Order } from './order.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export interface ListOrdersFilter {
  clientId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export abstract class OrderRepository {
  abstract save(order: Order): Promise<Order>;
  abstract findById(id: number): Promise<Order | null>;
  abstract findByQuoteId(quoteId: number): Promise<Order | null>;
  abstract findByOrderNumber(orderNumber: string): Promise<Order | null>;
  abstract generateNextOrderNumber(): Promise<string>;
  abstract findPaginated(filter: ListOrdersFilter): Promise<PaginatedResult<Order>>;
}
