import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';
import { FileSizeExceededError } from '../../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../../../../shared/file-storage/domain/errors/invalid-file-type.error.js';
import { UploadFileOptions } from '../../../../shared/file-storage/domain/upload-file-options.interface.js';
import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { VisitAttachmentWithUrl } from '../../domain/visit-attachment.entity.js';

@Injectable()
export class UploadVisitAttachmentUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly attachmentDao: VisitAttachmentDao,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
    file: UploadFileOptions,
  ): Promise<VisitAttachmentWithUrl> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    let uploaded: Awaited<ReturnType<FileStorageService['upload']>>;
    try {
      uploaded = await this.fileStorage.upload({
        ...file,
        folder: `visits/${visitId}`,
      });
    } catch (error) {
      if (error instanceof FileSizeExceededError) {
        throw new PayloadTooLargeException(error.message);
      }
      if (error instanceof InvalidFileTypeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    let attachment: Awaited<ReturnType<VisitAttachmentDao['create']>>;
    try {
      attachment = await this.attachmentDao.create({
        visitId,
        key: uploaded.key,
        originalName: uploaded.originalName,
        mimetype: uploaded.mimetype,
        size: uploaded.size,
      });
    } catch (persistenceError) {
      try {
        await this.fileStorage.delete(uploaded.key);
      } catch (cleanupError) {
        throw new AggregateError(
          [persistenceError, cleanupError],
          'Could not persist the visit attachment or remove its uploaded file.',
        );
      }
      throw persistenceError;
    }

    return {
      ...attachment,
      url: await this.fileStorage.getPresignedUrl(attachment.key),
    };
  }
}
