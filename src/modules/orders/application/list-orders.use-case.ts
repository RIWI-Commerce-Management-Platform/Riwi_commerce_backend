import { Injectable } from '@nestjs/common';
import {
  OrderRepository,
  ListOrdersFilter,
} from '../domain/order.repository.js';
import { Order } from '../domain/order.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

@Injectable()
export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  /** An advisor only sees their orders and a director their zone (HU-06). */
  async execute(
    filter: ListOrdersFilter,
    actor?: CurrentActor,
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findPaginated({
      ...filter,
      ...scopeForActor(actor),
    });
  }
}
