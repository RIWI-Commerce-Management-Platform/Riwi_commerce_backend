import { Injectable, NotFoundException } from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

/** HU-28: removes a visit file from S3 and from the database. */
@Injectable()
export class DeleteVisitAttachmentUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly attachmentDao: VisitAttachmentDao,
    private readonly fileStorage: FileStorageService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    visitId: number,
    attachmentId: number,
    advisorId: number,
  ): Promise<void> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);
    const attachment = visit
      ? await this.attachmentDao.findById(attachmentId)
      : null;

    if (!visit || !attachment || attachment.visitId !== visitId) {
      throw new NotFoundException('Attachment not found.');
    }

    await this.fileStorage.delete(attachment.fileKey);
    await this.attachmentDao.delete(attachmentId);

    await this.activityLog.record({
      action: 'visit.attachment_removed',
      entityType: 'visit',
      entityId: visitId,
      actorId: advisorId,
      description: `File removed from the visit: ${attachment.originalName}`,
      metadata: { clientId: visit.clientId, attachmentId },
    });
  }
}
