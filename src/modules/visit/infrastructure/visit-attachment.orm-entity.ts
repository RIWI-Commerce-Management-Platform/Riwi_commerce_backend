import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'visit_attachments' })
export class VisitAttachmentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'visit_id', type: 'integer' })
  visitId: number;

  @Column({ name: 'storage_key', type: 'text' })
  key: string;

  @Column({ name: 'original_name', type: 'text' })
  originalName: string;

  @Column({ type: 'varchar', length: 255 })
  mimetype: string;

  @Column({ type: 'integer' })
  size: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: 'now()' })
  createdAt: Date;
}
