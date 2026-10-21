import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'visit_results' })
export class VisitResultOptionOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
