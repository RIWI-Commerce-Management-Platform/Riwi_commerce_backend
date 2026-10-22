import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity.js';

@Entity('account')
export class AccountOrmEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'accountId' })
  accountId!: string;

  @Column('text', { name: 'providerId' })
  providerId!: string;

  @Index('account_userId_idx')
  @Column('text', { name: 'userId' })
  userId!: string;

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
