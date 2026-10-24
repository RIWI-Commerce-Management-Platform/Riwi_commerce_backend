import { OrderItem } from './order-item.entity.js';
import { OrderStatus } from './order-status.enum.js';
import { InvalidOrderStatusTransitionError } from './errors/invalid-order-status-transition.error.js';

export interface OrderProps {
  id?: number;
  orderNumber: string;
  quoteId: number;
  clientId: number;
  status?: OrderStatus;
  subtotal: number;
  total: number;
  items: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  readonly id?: number;
  readonly orderNumber: string;
  readonly quoteId: number;
  readonly clientId: number;
  status: OrderStatus;
  readonly subtotal: number;
  readonly total: number;
  readonly items: OrderItem[];
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: OrderProps) {
    this.id = props.id;
    this.orderNumber = props.orderNumber;
    this.quoteId = props.quoteId;
    this.clientId = props.clientId;
    this.status = props.status ?? OrderStatus.CREATED;
    this.subtotal = props.subtotal;
    this.total = props.total;
    this.items = props.items;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  changeStatus(newStatus: OrderStatus): void {
    if (this.status === newStatus) {
      return;
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
      [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const validNextStatuses = allowedTransitions[this.status] ?? [];
    if (!validNextStatuses.includes(newStatus)) {
      throw new InvalidOrderStatusTransitionError(this.status, newStatus);
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }
}
