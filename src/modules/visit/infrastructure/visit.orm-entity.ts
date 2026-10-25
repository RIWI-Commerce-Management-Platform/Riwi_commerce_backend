import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';

@Entity({ name: 'visits' })
export class VisitOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id', type: 'integer' })
  clientId: number;

  @ManyToOne('ClientOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client?: ClientOrmEntity;

  @Column({ name: 'advisor_id', type: 'integer' })
  advisorId: number;

  @Column({ name: 'route_id', type: 'integer', nullable: true })
  routeId: number | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'actual_date', type: 'date', nullable: true })
  actualDate: Date | null;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  objective: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observations: string | null;

  @Column({ name: 'quote_generated', type: 'boolean', default: false })
  quoteGenerated: boolean;

  @Column({ name: 'order_generated', type: 'boolean', default: false })
  orderGenerated: boolean;

  // Visit results are loaded explicitly by the DAO (join through
  // visit_result_links). No @OneToMany here on purpose: a bidirectional
  // ORM relation creates a circular ESM import with VisitResultLinkOrmEntity
  // that breaks at runtime ("Cannot access 'VisitOrmEntity' before
  // initialization"). The foreign keys live in the migration.
  resultLinks?: VisitResultLinkShape[];
}

export interface VisitResultLinkShape {
  resultId: number;
  observation: string | null;
  resultOption?: { name: string };
}
