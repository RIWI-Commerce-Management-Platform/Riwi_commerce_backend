import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import type { ClientTypeOrmEntity } from '../../catalogs/infrastructure/client-type.orm-entity.js';
import type { PotentialOrmEntity } from '../../catalogs/infrastructure/potential.orm-entity.js';
import type { ClientStatusOrmEntity } from '../../catalogs/infrastructure/client-status.orm-entity.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';

@Entity('clients')
export class ClientOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_cliente' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'text', nullable: true, unique: true })
  idUsuario!: string | null;

  @OneToOne(() => UserOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: UserOrmEntity | null;

  @Column({ type: 'varchar', length: 30, unique: true })
  nit!: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName!: string;

  @Column({ name: 'commercial_name', type: 'varchar', length: 255 })
  commercialName!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'varchar', length: 100 })
  department!: string;

  @Column({ type: 'varchar', length: 100 })
  municipality!: string;

  @Column({ type: 'varchar', length: 100 })
  neighborhood!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ name: 'zone_id', type: 'int' })
  zoneId!: number;

  @ManyToOne('ZoneOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'zone_id' })
  zone?: ZoneOrmEntity;

  @Column({ name: 'client_type_id', type: 'int' })
  clientTypeId!: number;

  @ManyToOne('ClientTypeOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_type_id' })
  clientType?: ClientTypeOrmEntity;

  @Column({ name: 'potential_id', type: 'int' })
  potentialId!: number;

  @ManyToOne('PotentialOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'potential_id' })
  potential?: PotentialOrmEntity;

  @Column({ name: 'client_status_id', type: 'int' })
  clientStatusId!: number;

  @ManyToOne('ClientStatusOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_status_id' })
  clientStatus?: ClientStatusOrmEntity;

  @Column({ name: 'visit_frequency_days', type: 'int' })
  visitFrequencyDays!: number;

  @Column({ name: 'latitude', type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ name: 'longitude', type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
