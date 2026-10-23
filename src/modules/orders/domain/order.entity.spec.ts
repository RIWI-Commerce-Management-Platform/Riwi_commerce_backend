import { describe, expect, it } from 'vitest';
import { Order } from './order.entity.js';
import { OrderStatus } from './order-status.enum.js';
import { OrderItem } from './order-item.entity.js';
import { InvalidOrderStatusTransitionError } from './errors/invalid-order-status-transition.error.js';
import { QuoteAlreadyConvertedError } from './errors/quote-already-converted.error.js';

describe('Order entity (Domain)', () => {
  const createBaseOrder = (status: OrderStatus = OrderStatus.CREATED) =>
    new Order({
      id: 1,
      orderNumber: 'PED-0001',
      quoteId: 10,
      clientId: 5,
      status,
      subtotal: 200,
      total: 200,
      items: [
        new OrderItem({
          id: 1,
          orderId: 1,
          productName: 'Monitor',
          quantity: 2,
          unitPrice: 100,
          subtotal: 200,
        }),
      ],
    });

  it('instantiates with defaults', () => {
    const order = createBaseOrder();
    expect(order.orderNumber).toBe('PED-0001');
    expect(order.status).toBe(OrderStatus.CREATED);
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
    expect(order.items).toHaveLength(1);
  });

  describe('QuoteAlreadyConvertedError', () => {
    it('formats error without orderNumber', () => {
      const error = new QuoteAlreadyConvertedError(10);
      expect(error.message).toBe('Quote with ID 10 has already been converted to an order.');
    });
  });

  describe('changeStatus transitions', () => {
    it('allows CREATED -> DISPATCHED', () => {
      const order = createBaseOrder(OrderStatus.CREATED);
      order.changeStatus(OrderStatus.DISPATCHED);
      expect(order.status).toBe(OrderStatus.DISPATCHED);
    });

    it('allows CREATED -> CANCELLED', () => {
      const order = createBaseOrder(OrderStatus.CREATED);
      order.changeStatus(OrderStatus.CANCELLED);
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('allows DISPATCHED -> DELIVERED', () => {
      const order = createBaseOrder(OrderStatus.DISPATCHED);
      order.changeStatus(OrderStatus.DELIVERED);
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it('allows DISPATCHED -> CANCELLED', () => {
      const order = createBaseOrder(OrderStatus.DISPATCHED);
      order.changeStatus(OrderStatus.CANCELLED);
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('does nothing when transitioning to the same status', () => {
      const order = createBaseOrder(OrderStatus.CREATED);
      order.changeStatus(OrderStatus.CREATED);
      expect(order.status).toBe(OrderStatus.CREATED);
    });

    it('throws InvalidOrderStatusTransitionError on invalid transition from CREATED to DELIVERED', () => {
      const order = createBaseOrder(OrderStatus.CREATED);
      expect(() => order.changeStatus(OrderStatus.DELIVERED)).toThrow(
        InvalidOrderStatusTransitionError,
      );
    });

    it('throws InvalidOrderStatusTransitionError on transition from terminal DELIVERED status', () => {
      const order = createBaseOrder(OrderStatus.DELIVERED);
      expect(() => order.changeStatus(OrderStatus.CANCELLED)).toThrow(
        InvalidOrderStatusTransitionError,
      );
    });

    it('throws InvalidOrderStatusTransitionError on transition from terminal CANCELLED status', () => {
      const order = createBaseOrder(OrderStatus.CANCELLED);
      expect(() => order.changeStatus(OrderStatus.DISPATCHED)).toThrow(
        InvalidOrderStatusTransitionError,
      );
    });
  });
});
