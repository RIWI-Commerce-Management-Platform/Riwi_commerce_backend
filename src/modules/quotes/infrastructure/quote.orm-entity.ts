import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuoteItemOrmEntity } from './quote-item.orm-entity.js';

@Entity('quotes')
export class QuoteOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'quote_number', type: 'varchar', length: 30, unique: true })
  quoteNumber!: string;

  @Column({ name: 'client_id', type: 'int' })
  clientId!: number;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'document_key', type: 'varchar', length: 255, nullable: true })
  documentKey!: string | null;

  @OneToMany(() => QuoteItemOrmEntity, (item) => item.quote, {
    cascade: true,
    eager: true,
  })
  items!: QuoteItemOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
