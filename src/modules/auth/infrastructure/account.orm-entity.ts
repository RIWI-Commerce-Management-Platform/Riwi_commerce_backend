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

@Entity('account')
export class AccountOrmEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text', { name: 'accountId' })
  accountId!: string;

  @Column('text', { name: 'providerId' })
  providerId!: string;

  @Index('account_userId_idx')
  @Column('integer', { name: 'userId' })
  userId!: number;

  @Column('text', { name: 'accessToken', nullable: true })
  accessToken!: string | null;

  @Column('text', { name: 'refreshToken', nullable: true })
  refreshToken!: string | null;

  @Column('text', { name: 'idToken', nullable: true })
  idToken!: string | null;

  @Column('timestamptz', { name: 'accessTokenExpiresAt', nullable: true })
  accessTokenExpiresAt!: Date | null;

  @Column('timestamptz', { name: 'refreshTokenExpiresAt', nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @Column('text', { name: 'scope', nullable: true })
  scope!: string | null;

  @Column('text', { name: 'password', nullable: true })
  password!: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: UserOrmEntity;
}
