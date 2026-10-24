import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity.js';

@Entity('session')
export class SessionOrmEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('timestamptz', { name: 'expiresAt' })
  expiresAt!: Date;

  @Column('text', { name: 'token', unique: true })
  token!: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt!: Date;

  @Column('text', { name: 'ipAddress', nullable: true })
  ipAddress!: string | null;

  @Column('text', { name: 'userAgent', nullable: true })
  userAgent!: string | null;

  @Index('session_userId_idx')
  @Column('integer', { name: 'userId' })
  userId!: number;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: UserOrmEntity;
}
