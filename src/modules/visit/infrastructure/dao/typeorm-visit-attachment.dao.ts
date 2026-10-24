import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { VisitAttachment } from '../../domain/visit-attachment.entity.js';

import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';

import { VisitAttachmentOrmEntity } from '../visit-attachment.orm-entity.js';

@Injectable()
export class TypeOrmVisitAttachmentDao implements VisitAttachmentDao {
  constructor(
    @InjectRepository(VisitAttachmentOrmEntity)
    private readonly repository: Repository<VisitAttachmentOrmEntity>,
  ) {}

  async save(attachment: VisitAttachment): Promise<VisitAttachment> {
    const saved = await this.repository.save(
      this.repository.create(attachment.toJSON()),
    );
    return this.toDomain(saved);
  }

  async findByVisitId(visitId: number): Promise<VisitAttachment[]> {
    const rows = await this.repository.find({
      where: { visitId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: number): Promise<VisitAttachment | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete({ id });
  }

  private toDomain(row: VisitAttachmentOrmEntity): VisitAttachment {
    return new VisitAttachment({
      id: row.id,
      visitId: row.visitId,
      fileKey: row.fileKey,
      originalName: row.originalName,
      mimeType: row.mimeType,
      size: row.size,
      uploadedById: row.uploadedById,
      createdAt: row.createdAt,
    });
  }
}
