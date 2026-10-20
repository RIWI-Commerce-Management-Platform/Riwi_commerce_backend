import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('client')
export class ClientOrmEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id_cliente' })
  idCliente!: number;

  @Column({ name: 'nit', type: 'varchar', length: 200, unique: true })
  nit!: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 200 })
  razonSocial!: string;

  @Column({ name: 'nombre_comercial', type: 'varchar', length: 200 })
  nombreComercial!: string;

  @Column({ type: 'varchar', length: 255 })
  direccion!: string;

  @Column({ type: 'varchar', length: 100 })
  departamento!: string;

  @Column({ type: 'varchar', length: 100 })
  municipio!: string;

  @Column({ type: 'varchar', length: 100 })
  barrio!: string;

  @Column({ type: 'varchar', length: 30 })
  telefono!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'id_zona', type: 'uuid' })
  idZona!: string;

  @Column({ name: 'id_tipo_cliente', type: 'uuid' })
  idTipoCliente!: string;

  @Column({ name: 'id_potencial', type: 'uuid' })
  idPotencial!: string;

  @Column({ name: 'id_estado_cliente', type: 'uuid' })
  idEstadoCliente!: string;

  @Column({ name: 'frecuencia_visita_dias', type: 'integer' })
  frecuenciaVisitaDias!: number;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
