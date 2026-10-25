import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';

import { VisitAttachment } from '../../domain/visit-attachment.entity.js';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';

import { FileSizeExceededError } from '../../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';

import { InvalidFileTypeError } from '../../../../shared/file-storage/domain/errors/invalid-file-type.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

export interface VisitAttachmentFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface VisitAttachmentWithUrl {
  attachment: VisitAttachment;
  url: string;
}

/**
 * HU-28: uploads a photo or document of the visit to S3 through the shared
 * FileStorageService. The database only keeps the S3 key.
 */
@Injectable()
export class UploadVisitAttachmentUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly attachmentDao: VisitAttachmentDao,
    private readonly fileStorage: FileStorageService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
    file: VisitAttachmentFile,
  ): Promise<VisitAttachmentWithUrl> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    let uploaded;

    try {
      uploaded = await this.fileStorage.upload({
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        folder: `visits/${visitId}`,
      });
    } catch (error) {
      if (
        error instanceof FileSizeExceededError ||
        error instanceof InvalidFileTypeError
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const attachment = await this.attachmentDao.save(
      new VisitAttachment({
        visitId,
        fileKey: uploaded.key,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimetype,
        size: uploaded.size,
        uploadedById: advisorId,
      }),
    );

    await this.activityLog.record({
      action: 'visit.attachment_added',
      entityType: 'visit',
      entityId: visitId,
      actorId: advisorId,
      description: `File attached to the visit: ${attachment.originalName}`,
      metadata: { clientId: visit.clientId, attachmentId: attachment.id },
    });

    return {
      attachment,
      url: await this.fileStorage.getPresignedUrl(attachment.fileKey),
    };
  }
}
