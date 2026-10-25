import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RouteStopOrmEntity } from './route-stop.orm-entity.js';
import type { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';

/**
 * TypeORM entity for the `routes` table (RUTA): the commercial routes
 * created by regional directors, with their weekly schedule, zone, assigned
 * advisor and route metrics.
 */
@Entity('routes')
export class RouteOrmEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ name: 'zone_id', type: 'integer' })
  zoneId!: number;

  @ManyToOne('ZoneOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'zone_id' })
  zone?: ZoneOrmEntity;

  @Column({ name: 'advisor_id', type: 'integer', nullable: true })
  advisorId!: number | null;

  @Column({ name: 'day_of_week', type: 'varchar', length: 20 })
  dayOfWeek!: string;

  @Column({ name: 'frequency', type: 'varchar', length: 30 })
  frequency!: string;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime!: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime!: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string | Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | Date | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'DRAFT' })
  status!: string;

  @Column({
    name: 'total_distance_km',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  totalDistanceKm!: number | null;

  @Column({
    name: 'estimated_duration_minutes',
    type: 'integer',
    nullable: true,
  })
  estimatedDurationMinutes!: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => RouteStopOrmEntity, (stop) => stop.route, {
    cascade: true,
    eager: true,
  })
  stops!: RouteStopOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
