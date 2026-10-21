import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('user')
export class UserOrmEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'name' })
  name!: string;

  @Column('text', { name: 'email', unique: true })
  email!: string;

  @Column('boolean', { name: 'emailVerified', default: false })
  emailVerified!: boolean;

  @Column('text', { name: 'image', nullable: true })
  image!: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt!: Date;
}
