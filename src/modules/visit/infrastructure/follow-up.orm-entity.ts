import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// No ORM relations on purpose (see visit-result-link.orm-entity.ts); the
// foreign keys are declared in the migration.
@Entity({ name: 'follow_ups' })
export class FollowUpOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'visit_id', type: 'integer', nullable: true })
  visitId: number | null;

  @Column({ name: 'client_id', type: 'integer' })
  clientId: number;

  @Column({ name: 'responsible_id', type: 'integer' })
  responsibleId: number;

  @Column({ name: 'created_by', type: 'integer' })
  createdById: number;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 150 })
  activity: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observation: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
