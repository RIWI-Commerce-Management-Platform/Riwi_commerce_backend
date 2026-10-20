import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'visits' })
export class VisitOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column({ name: 'advisor_id' })
  advisorId: number;

  @Column({type: 'integer'})
  routeId: number | null;

  @Column({ name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({
    name: 'actual_date',
    type: 'date',
    nullable: true,
  })
  actualDate: Date | null;

  @Column({ name: 'actual_date', type: 'time', nullable: true })
  startTime: string | null;

  @Column({
    name: 'end_time',
    type: 'time',
    nullable: true,
  })
  endTime: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'PENDING',
  })
  status: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  objective: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  observations: string | null;
}
