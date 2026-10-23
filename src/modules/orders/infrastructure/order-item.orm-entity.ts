import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { OrderOrmEntity } from './order.orm-entity.js';

@Entity('order_items')
export class OrderItemOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'order_id', type: 'int' })
  orderId!: number;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @ManyToOne('OrderOrmEntity', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: OrderOrmEntity;
}
