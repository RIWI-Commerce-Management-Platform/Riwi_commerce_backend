import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../domain/order.repository.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { Order } from '../domain/order.entity.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';
import { ChangeOrderStatusCommand } from './dto/change-order-status.command.js';

@Injectable()
export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(command: ChangeOrderStatusCommand): Promise<Order> {
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new OrderNotFoundError(command.orderId);
    }

    const previousStatus = order.status;
    order.changeStatus(command.newStatus);

    const savedOrder = await this.orderRepository.save(order);

    await this.activityLogService.record({
      action: 'order.status_changed',
      entityType: 'order',
      entityId: savedOrder.id!,
      actorId: command.actorId ?? 1,
      description: `Order ${savedOrder.orderNumber} status changed from ${previousStatus} to ${command.newStatus}`,
      metadata: {
        orderNumber: savedOrder.orderNumber,
        previousStatus,
        newStatus: command.newStatus,
      },
    });

    return savedOrder;
  }
}
