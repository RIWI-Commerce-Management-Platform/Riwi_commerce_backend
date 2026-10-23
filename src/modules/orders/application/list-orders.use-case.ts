import { Injectable } from '@nestjs/common';
import {
  OrderRepository,
  ListOrdersFilter,
} from '../domain/order.repository.js';
import { Order } from '../domain/order.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

@Injectable()
export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(filter: ListOrdersFilter): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findPaginated(filter);
  }
}
