import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clients')
export class ClientOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @Column({ name: 'client_type_id', type: 'int' })
  clientTypeId!: number;

  @Column({ name: 'potential_id', type: 'int' })
  potentialId!: number;

  @Column({ name: 'client_status_id', type: 'int' })
  clientStatusId!: number;

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
