import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'follow_ups' })
export class FollowUpOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'visit_id', type: 'integer' })
  visitId: number;

  @Column({ name: 'next_date', type: 'date' })
  nextDate: Date;

  @Column({ type: 'varchar', length: 150 })
  activity: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observation: string | null;

  @Column({ name: 'responsible_advisor_id', type: 'integer' })
  responsibleAdvisorId: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: 'now()' })
  updatedAt: Date;
}
