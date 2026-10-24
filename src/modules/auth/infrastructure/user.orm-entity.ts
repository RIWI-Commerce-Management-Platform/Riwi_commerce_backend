import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../domain/user-role.enum.js';

@Entity('user')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text', { name: 'name' })
  name!: string;

  @Column('text', { name: 'email', unique: true })
  email!: string;

  @Column('boolean', { name: 'emailVerified', default: false })
  emailVerified!: boolean;

  @Column('text', { name: 'image', nullable: true })
  image!: string | null;

  @Column('varchar', { name: 'role', length: 32, default: UserRole.ASESOR })
  role!: UserRole;

  @Column('integer', { name: 'zoneId', nullable: true })
  zoneId!: number | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt!: Date;
}
