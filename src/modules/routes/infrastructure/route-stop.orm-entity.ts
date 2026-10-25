import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { RouteOrmEntity } from './route.orm-entity.js';
import type { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';

/**
 * TypeORM entity for the `route_stops` table (RUTA_CLIENTE): each client
 * stop of a route with its visit order, suggested time and expected
 * duration. The relation uses a type-only import and a string target to
 * avoid an ESM import cycle.
 */
@Entity('route_stops')
export class RouteStopOrmEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id!: number;

  @Column({ name: 'route_id', type: 'integer' })
  routeId!: number;

  @ManyToOne('RouteOrmEntity', 'stops', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_id' })
  route?: RouteOrmEntity;

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number;

  @ManyToOne('ClientOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client?: ClientOrmEntity;

  @Column({ name: 'visit_order', type: 'integer' })
  visitOrder!: number;

  @Column({ name: 'suggested_time', type: 'time', nullable: true })
  suggestedTime!: string | null;

  @Column({
    name: 'estimated_duration_minutes',
    type: 'integer',
    default: 30,
  })
  estimatedDurationMinutes!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
