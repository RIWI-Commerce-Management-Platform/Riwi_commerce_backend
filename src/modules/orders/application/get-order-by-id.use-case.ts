import { Injectable } from '@nestjs/common';
import { OrderDao } from '../domain/order.dao.js';
import { Order } from '../domain/order.entity.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(private readonly orderDao: OrderDao) {}

  async execute(orderId: number, actor?: CurrentActor): Promise<Order> {
    const order = await this.orderDao.findById(orderId, scopeForActor(actor));
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }
}
