import { Injectable, NotFoundException } from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';

import { VisitAttachmentWithUrl } from './upload-visit-attachment.use-case.js';

/** HU-28: the visit's files with a temporary signed URL each. */
@Injectable()
export class ListVisitAttachmentsUseCase {
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
        attachment,
        url: await this.fileStorage.getPresignedUrl(attachment.fileKey),
      })),
    );
  }
}
