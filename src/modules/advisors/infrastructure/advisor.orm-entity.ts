import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';

@Entity('asesor')
export class AdvisorOrmEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id_asesor' })
  idAsesor!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 200 })
  nombre!: string;

  @Column({ name: 'correo', type: 'varchar', length: 255 })
  correo!: string;

  @Column({ name: 'telefono', type: 'varchar', length: 30 })
  telefono!: string;

  @Column({ name: 'estado', type: 'boolean', default: true })
  estado!: boolean;

  @Column({ name: 'id_usuario', type: 'text', unique: true, nullable: true })
  idUsuario!: string | null;

  @OneToOne(() => UserOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: UserOrmEntity | null;
}
