import { Injectable } from '@nestjs/common';
import { OrderDao } from '../domain/order.dao.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { Order } from '../domain/order.entity.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';
import { scopeForActor } from '../../../shared/auth/domain/current-actor.provider.js';
import { ChangeOrderStatusCommand } from './dto/change-order-status.command.js';

@Injectable()
export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orderDao: OrderDao,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(command: ChangeOrderStatusCommand): Promise<Order> {
    const order = await this.orderDao.findById(
      command.orderId,
      scopeForActor(command.actor),
    );
    if (!order) {
      throw new OrderNotFoundError(command.orderId);
    }

    const previousStatus = order.status;
    order.changeStatus(command.newStatus);

    const savedOrder = await this.orderDao.save(order);

    await this.activityLogService.record({
      action: 'order.status_changed',
      entityType: 'order',
      entityId: savedOrder.id!,
      actorId: command.actorId,
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
