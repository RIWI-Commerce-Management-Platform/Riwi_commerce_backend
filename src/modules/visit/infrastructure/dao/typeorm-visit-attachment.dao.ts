import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';
import {
  NewVisitAttachment,
  VisitAttachment,
} from '../../domain/visit-attachment.entity.js';
import { VisitAttachmentOrmEntity } from '../visit-attachment.orm-entity.js';

@Injectable()
export class TypeOrmVisitAttachmentDao implements VisitAttachmentDao {
  constructor(
    @InjectRepository(VisitAttachmentOrmEntity)
    private readonly repository: Repository<VisitAttachmentOrmEntity>,
  ) {}

  async create(attachment: NewVisitAttachment): Promise<VisitAttachment> {
    const entity = this.repository.create(attachment);
    return this.repository.save(entity);
  }

  async findByVisitId(visitId: number): Promise<VisitAttachment[]> {
    return this.repository.find({
      where: { visitId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }
}
