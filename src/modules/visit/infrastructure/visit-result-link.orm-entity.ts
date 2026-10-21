import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// No @ManyToOne relations on purpose: a bidirectional ORM relation with
// VisitOrmEntity creates a circular ESM import that breaks at runtime
// ("Cannot access 'VisitOrmEntity' before initialization"). The foreign keys
// are declared in the migration (FK_visit_result_links_visit and
// FK_visit_result_links_result).
@Entity({ name: 'visit_result_links' })
export class VisitResultLinkOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'visit_id', type: 'integer' })
  visitId: number;

  @Column({ name: 'result_id', type: 'integer' })
  resultId: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observation: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
