import { Injectable, NotFoundException } from '@nestjs/common';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';
import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { VisitAttachmentWithUrl } from '../../domain/visit-attachment.entity.js';

@Injectable()
export class GetVisitAttachmentsUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly attachmentDao: VisitAttachmentDao,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
  ): Promise<VisitAttachmentWithUrl[]> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const attachments = await this.attachmentDao.findByVisitId(visitId);

    return Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        url: await this.fileStorage.getPresignedUrl(attachment.key),
      })),
    );
  }
}
