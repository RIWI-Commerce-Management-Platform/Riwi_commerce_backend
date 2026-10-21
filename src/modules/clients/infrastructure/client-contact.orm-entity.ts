import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity.js';

@Entity('client_contacts')
export class ClientContactOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'client_id', type: 'int' })
  clientId!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  position!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'varchar', length: 30 })
  mobile!: string;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => ClientOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client?: ClientOrmEntity;
}
