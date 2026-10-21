import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('verification')
export class VerificationOrmEntity {
  @PrimaryColumn('text')
  id!: string;

  @Index('verification_identifier_idx')
  @Column('text', { name: 'identifier' })
  identifier!: string;

  @Column('text', { name: 'value' })
  value!: string;

  @Column('timestamptz', { name: 'expiresAt' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt!: Date;
}
