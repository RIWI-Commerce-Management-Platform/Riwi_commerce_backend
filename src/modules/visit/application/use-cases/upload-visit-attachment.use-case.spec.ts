import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';
import { FileSizeExceededError } from '../../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../../../../shared/file-storage/domain/errors/invalid-file-type.error.js';
import { UploadVisitAttachmentUseCase } from './upload-visit-attachment.use-case.js';
import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { Visit, VisitStatus } from '../../domain/visit.entity.js';

describe('UploadVisitAttachmentUseCase', () => {
  let useCase: UploadVisitAttachmentUseCase;
  let mockVisitDao: { findByIdAndAdvisor: ReturnType<typeof vi.fn> };
  let mockAttachmentDao: {
    create: ReturnType<typeof vi.fn>;
    findByVisitId: ReturnType<typeof vi.fn>;
  };
  let mockFileStorage: {
    upload: ReturnType<typeof vi.fn>;
    getPresignedUrl: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockVisitDao = {
      findByIdAndAdvisor: vi.fn().mockResolvedValue(
        new Visit({
          id: 1,
          clientId: 10,
          advisorId: 20,
          routeId: null,
          scheduledAt: new Date('2026-10-20T14:00:00.000Z'),
          actualDate: null,
          startTime: null,
          endTime: null,
          status: VisitStatus.PENDING,
          objective: 'Present catalog',
        }),
      ),
    };
    mockAttachmentDao = {
      create: vi.fn().mockResolvedValue({
        id: 7,
        visitId: 1,
        key: 'visits/1/file.pdf',
        originalName: 'file.pdf',
        mimetype: 'application/pdf',
        size: 4,
        createdAt: new Date('2026-10-20T14:00:00.000Z'),
      }),
      findByVisitId: vi.fn(),
    };
    mockFileStorage = {
      upload: vi.fn().mockResolvedValue({
        key: 'visits/1/file.pdf',
        originalName: 'file.pdf',
        mimetype: 'application/pdf',
        size: 4,
      }),
      getPresignedUrl: vi
        .fn()
        .mockResolvedValue('https://example.test/file.pdf'),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new UploadVisitAttachmentUseCase(
      mockVisitDao as unknown as VisitDao,
      mockAttachmentDao as unknown as VisitAttachmentDao,
      mockFileStorage as unknown as FileStorageService,
    );
  });

  it('uploads to the visit folder, persists metadata, and returns a preview URL', async () => {
    const file = {
      buffer: Buffer.from('data'),
      filename: 'file.pdf',
      mimetype: 'application/pdf',
    };

    const result = await useCase.execute(1, 20, file);

    expect(mockVisitDao.findByIdAndAdvisor).toHaveBeenCalledWith(1, 20);
    expect(mockFileStorage.upload).toHaveBeenCalledWith({
      ...file,
      folder: 'visits/1',
    });
    expect(mockAttachmentDao.create).toHaveBeenCalledWith({
      visitId: 1,
      key: 'visits/1/file.pdf',
      originalName: 'file.pdf',
      mimetype: 'application/pdf',
      size: 4,
    });
    expect(mockFileStorage.getPresignedUrl).toHaveBeenCalledWith(
      'visits/1/file.pdf',
    );
    expect(result.url).toBe('https://example.test/file.pdf');
    expect(result.id).toBe(7);
  });

  it('does not upload when the visit is missing or belongs to another advisor', async () => {
    mockVisitDao.findByIdAndAdvisor.mockResolvedValue(null);

    await expect(
      useCase.execute(1, 999, {
        buffer: Buffer.from('data'),
        filename: 'file.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockFileStorage.upload).not.toHaveBeenCalled();
  });

  it('maps unsupported types and oversized files to HTTP exceptions', async () => {
    const file = {
      buffer: Buffer.from('data'),
      filename: 'file.pdf',
      mimetype: 'application/pdf',
    };
    mockFileStorage.upload.mockRejectedValueOnce(
      new InvalidFileTypeError('application/x-sh', ['application/pdf']),
    );
    await expect(useCase.execute(1, 20, file)).rejects.toThrow(
      BadRequestException,
    );

    mockFileStorage.upload.mockRejectedValueOnce(
      new FileSizeExceededError(10 * 1024 * 1024),
    );
    await expect(useCase.execute(1, 20, file)).rejects.toThrow(
      PayloadTooLargeException,
    );
  });

  it('removes the uploaded object if metadata persistence fails', async () => {
    const persistenceError = new Error('database unavailable');
    mockAttachmentDao.create.mockRejectedValue(persistenceError);

    await expect(
      useCase.execute(1, 20, {
        buffer: Buffer.from('data'),
        filename: 'file.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toBe(persistenceError);

    expect(mockFileStorage.delete).toHaveBeenCalledWith('visits/1/file.pdf');
  });

  it('surfaces both persistence and cleanup errors', async () => {
    const persistenceError = new Error('database unavailable');
    const cleanupError = new Error('storage unavailable');
    mockAttachmentDao.create.mockRejectedValue(persistenceError);
    mockFileStorage.delete.mockRejectedValue(cleanupError);

    await expect(
      useCase.execute(1, 20, {
        buffer: Buffer.from('data'),
        filename: 'file.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toThrow(AggregateError);
  });
});
