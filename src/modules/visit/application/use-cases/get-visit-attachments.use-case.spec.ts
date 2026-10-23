import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import { FileStorageService } from '../../../../shared/file-storage/domain/file-storage.service.js';
import { GetVisitAttachmentsUseCase } from './get-visit-attachments.use-case.js';
import { VisitAttachmentDao } from '../../domain/dao/visit-attachment.dao.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { Visit, VisitStatus } from '../../domain/visit.entity.js';

describe('GetVisitAttachmentsUseCase', () => {
  let useCase: GetVisitAttachmentsUseCase;
  let mockVisitDao: { findByIdAndAdvisor: ReturnType<typeof vi.fn> };
  let mockAttachmentDao: { findByVisitId: ReturnType<typeof vi.fn> };
  let mockFileStorage: { getPresignedUrl: ReturnType<typeof vi.fn> };

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
      findByVisitId: vi.fn().mockResolvedValue([
        {
          id: 7,
          visitId: 1,
          key: 'visits/1/file.pdf',
          originalName: 'file.pdf',
          mimetype: 'application/pdf',
          size: 4,
          createdAt: new Date('2026-10-20T14:00:00.000Z'),
        },
      ]),
    };
    mockFileStorage = {
      getPresignedUrl: vi
        .fn()
        .mockResolvedValue('https://example.test/file.pdf'),
    };

    useCase = new GetVisitAttachmentsUseCase(
      mockVisitDao as unknown as VisitDao,
      mockAttachmentDao as unknown as VisitAttachmentDao,
      mockFileStorage as unknown as FileStorageService,
    );
  });

  it('returns the visit attachments with temporary URLs', async () => {
    const result = await useCase.execute(1, 20);

    expect(mockVisitDao.findByIdAndAdvisor).toHaveBeenCalledWith(1, 20);
    expect(mockAttachmentDao.findByVisitId).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.test/file.pdf');
  });

  it('does not return attachments when the visit is missing or unauthorized', async () => {
    mockVisitDao.findByIdAndAdvisor.mockResolvedValue(null);

    await expect(useCase.execute(1, 999)).rejects.toThrow(NotFoundException);
    expect(mockAttachmentDao.findByVisitId).not.toHaveBeenCalled();
  });
});
