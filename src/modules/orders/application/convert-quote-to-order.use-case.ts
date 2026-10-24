import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../domain/order.repository.js';
import { QuoteRepository } from '../../quotes/domain/quote.repository.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { Order } from '../domain/order.entity.js';
import { OrderItem } from '../domain/order-item.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { QuoteStatus } from '../../quotes/domain/quote-status.enum.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { scopeForActor } from '../../../shared/auth/domain/current-actor.provider.js';
import { ConvertQuoteToOrderCommand } from './dto/convert-quote-to-order.command.js';

@Injectable()
export class ConvertQuoteToOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(command: ConvertQuoteToOrderCommand): Promise<Order> {
    const quote = await this.quoteRepository.findById(
      command.quoteId,
      scopeForActor(command.actor),
    );
    if (!quote) {
      throw new QuoteNotFoundError(command.quoteId);
    }

    if (quote.status !== QuoteStatus.APPROVED) {
      throw new QuoteNotApprovedForOrderError(
        quote.quoteNumber ?? `ID-${command.quoteId}`,
        quote.status,
      );
    }

    const existingOrder = await this.orderRepository.findByQuoteId(
      command.quoteId,
    );
    if (existingOrder) {
      throw new QuoteAlreadyConvertedError(
        command.quoteId,
        existingOrder.orderNumber,
      );
    }

    const orderNumber = await this.orderRepository.generateNextOrderNumber();

    const items = quote.items.map(
      (item) =>
        new OrderItem({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }),
    );

    const newOrder = new Order({
      orderNumber,
      quoteId: quote.id!,
      clientId: quote.clientId,
      advisorId: quote.advisorId,
      status: OrderStatus.CREATED,
      subtotal: quote.subtotal,
      total: quote.total,
      items,
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    await this.activityLogService.record({
      action: 'order.created',
      entityType: 'order',
      entityId: savedOrder.id!,
      actorId: command.actorId,
      description: `Order ${savedOrder.orderNumber} created from Quote ${quote.quoteNumber}`,
      metadata: {
        orderNumber: savedOrder.orderNumber,
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        clientId: quote.clientId,
        total: savedOrder.total,
      },
    });

    return savedOrder;
  }
}
