import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemOrmEntity } from './order-item.orm-entity.js';
import type { QuoteOrmEntity } from '../../quotes/infrastructure/quote.orm-entity.js';
import type { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';

@Entity('orders')
export class OrderOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'order_number', type: 'varchar', length: 30, unique: true })
  orderNumber!: string;

  @Column({ name: 'quote_id', type: 'int', unique: true })
  quoteId!: number;

  @OneToOne('QuoteOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quote_id' })
  quote?: QuoteOrmEntity;

  @Column({ name: 'client_id', type: 'int' })
  clientId!: number;

  @ManyToOne('ClientOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client?: ClientOrmEntity;

  @Column({ name: 'advisor_id', type: 'int', nullable: true })
  advisorId!: number | null;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItemOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
