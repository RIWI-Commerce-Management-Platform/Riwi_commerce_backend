import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../domain/order.repository.js';
import { Order } from '../domain/order.entity.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }
}
