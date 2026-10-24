import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// No ORM relations on purpose (see visit-result-link.orm-entity.ts); the
// foreign keys are declared in the migration.
@Entity({ name: 'visit_attachments' })
export class VisitAttachmentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'visit_id', type: 'integer' })
  visitId: number;

  @Column({ name: 'file_key', type: 'varchar', length: 255 })
  fileKey: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'integer' })
  size: number;

  @Column({ name: 'uploaded_by', type: 'integer' })
  uploadedById: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
