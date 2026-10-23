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
 * Entidad de persistencia TypeORM para la tabla `route_stops` (RUTA_CLIENTE).
 * 
 * En este modelo almaceno cada parada de cliente asociada a una ruta comercial,
 * registrando el orden de visita secuencial, la hora sugerida y la duración esperada.
 * Utilizo importación de tipo e identificador por string para evitar ciclos ESM en Node 24.
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
