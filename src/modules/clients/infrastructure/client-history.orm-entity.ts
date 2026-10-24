import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * HISTORIAL_CLIENTE: one row per action recorded through ActivityLogService.
 * No ORM relations on purpose; the foreign keys and the index live in the
 * migration.
 */
@Entity('client_history')
export class ClientHistoryOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'client_id', type: 'int', nullable: true })
  clientId!: number | null;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 40 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 40 })
  entityId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
