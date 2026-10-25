import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Commercial profile of a user with the ASESOR role. The primary key is the
 * user id, which is also the advisor id stored in routes and visits.
 */
@Entity('advisors')
export class AdvisorOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  documentNumber!: string | null;

  @Column({ name: 'zone_id', type: 'int', nullable: true })
  zoneId!: number | null;

  @Column({ name: 'weekly_visit_goal', type: 'int', nullable: true })
  weeklyVisitGoal!: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
