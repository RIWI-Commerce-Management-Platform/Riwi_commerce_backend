import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { QuoteOrmEntity } from './quote.orm-entity.js';

@Entity('quote_items')
export class QuoteItemOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'quote_id', type: 'int' })
  quoteId!: number;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @ManyToOne('QuoteOrmEntity', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quote_id' })
  quote?: QuoteOrmEntity;
}
