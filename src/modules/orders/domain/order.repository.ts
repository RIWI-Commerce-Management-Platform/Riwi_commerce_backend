import { Order } from './order.entity.js';

export abstract class OrderRepository {
  abstract save(order: Order): Promise<Order>;
  abstract findById(id: number): Promise<Order | null>;
  abstract findByQuoteId(quoteId: number): Promise<Order | null>;
  abstract findByOrderNumber(orderNumber: string): Promise<Order | null>;
  abstract generateNextOrderNumber(): Promise<string>;
}
