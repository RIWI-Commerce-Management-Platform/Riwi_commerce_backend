import { Order } from '../domain/order.entity.js';
import { OrderItem } from '../domain/order-item.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { OrderOrmEntity } from './order.orm-entity.js';
import { OrderItemOrmEntity } from './order-item.orm-entity.js';

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    const items = (orm.items ?? []).map(
      (itemOrm) =>
        new OrderItem({
          id: itemOrm.id,
          orderId: itemOrm.orderId,
          productName: itemOrm.productName,
          quantity: itemOrm.quantity,
          unitPrice: Number(itemOrm.unitPrice),
          subtotal: Number(itemOrm.subtotal),
        }),
    );

    return new Order({
      id: orm.id,
      orderNumber: orm.orderNumber,
      quoteId: orm.quoteId,
      clientId: orm.clientId,
      status: orm.status as OrderStatus,
      subtotal: Number(orm.subtotal),
      total: Number(orm.total),
      items,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Order): OrderOrmEntity {
    const orm = new OrderOrmEntity();
    if (domain.id !== undefined) {
      orm.id = domain.id;
    }
    orm.orderNumber = domain.orderNumber;
    orm.quoteId = domain.quoteId;
    orm.clientId = domain.clientId;
    orm.status = domain.status;
    orm.subtotal = domain.subtotal;
    orm.total = domain.total;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;

    orm.items = (domain.items ?? []).map((domainItem) => {
      const itemOrm = new OrderItemOrmEntity();
      if (domainItem.id !== undefined) {
        itemOrm.id = domainItem.id;
      }
      itemOrm.order = orm;
      itemOrm.productName = domainItem.productName;
      itemOrm.quantity = domainItem.quantity;
      itemOrm.unitPrice = domainItem.unitPrice;
      itemOrm.subtotal = domainItem.subtotal;
      return itemOrm;
    });

    return orm;
  }
}
