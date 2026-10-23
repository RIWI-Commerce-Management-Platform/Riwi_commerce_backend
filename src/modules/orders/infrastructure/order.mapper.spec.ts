import { describe, expect, it } from 'vitest';
import { OrderMapper } from './order.mapper.js';
import { Order } from '../domain/order.entity.js';
import { OrderItem } from '../domain/order-item.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { OrderOrmEntity } from './order.orm-entity.js';
import { OrderItemOrmEntity } from './order-item.orm-entity.js';

describe('OrderMapper (Infrastructure)', () => {
  it('maps ORM entity to Domain entity', () => {
    const orm = new OrderOrmEntity();
    orm.id = 1;
    orm.orderNumber = 'PED-0001';
    orm.quoteId = 10;
    orm.clientId = 5;
    orm.status = 'CREATED';
    orm.subtotal = 300;
    orm.total = 300;
    orm.createdAt = new Date('2026-10-23T00:00:00Z');
    orm.updatedAt = new Date('2026-10-23T00:00:00Z');

    const itemOrm = new OrderItemOrmEntity();
    itemOrm.id = 2;
    itemOrm.orderId = 1;
    itemOrm.productName = 'Box of Screws';
    itemOrm.quantity = 3;
    itemOrm.unitPrice = 100;
    itemOrm.subtotal = 300;
    orm.items = [itemOrm];

    const domain = OrderMapper.toDomain(orm);

    expect(domain.id).toBe(1);
    expect(domain.orderNumber).toBe('PED-0001');
    expect(domain.status).toBe(OrderStatus.CREATED);
    expect(domain.items).toHaveLength(1);
    expect(domain.items[0].productName).toBe('Box of Screws');
  });

  it('maps Domain entity to ORM entity', () => {
    const domain = new Order({
      id: 1,
      orderNumber: 'PED-0001',
      quoteId: 10,
      clientId: 5,
      status: OrderStatus.CREATED,
      subtotal: 100,
      total: 100,
      items: [
        new OrderItem({
          id: 5,
          orderId: 1,
          productName: 'Drill',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
        }),
      ],
      createdAt: new Date('2026-10-23T00:00:00Z'),
      updatedAt: new Date('2026-10-23T00:00:00Z'),
    });

    const orm = OrderMapper.toOrm(domain);

    expect(orm.id).toBe(1);
    expect(orm.orderNumber).toBe('PED-0001');
    expect(orm.items).toHaveLength(1);
    expect(orm.items[0].productName).toBe('Drill');
    expect(orm.items[0].order).toBe(orm);
  });
});
