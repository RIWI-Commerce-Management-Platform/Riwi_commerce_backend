import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { Request } from 'express';

import { VisitsController } from './visit.controller.js';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { RescheduleVisitUseCase } from '../../application/use-cases/reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from '../../application/use-cases/mark-visit-not-visited.use-case.js';

import { GetVisitAttachmentsUseCase } from '../../application/use-cases/get-visit-attachments.use-case.js';

import { UploadVisitAttachmentUseCase } from '../../application/use-cases/upload-visit-attachment.use-case.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { CurrentAdvisorProvider } from '../../../../shared/auth/domain/current-advisor.provider.js';

import { VisitSummaryResponseDto } from '../dtos/visit-summary-response.dto.js';

import { VisitDetailResponseDto } from '../dtos/visit-detail-response.dto.js';

function buildVisit(status: VisitStatus = VisitStatus.PENDING) {
  return new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
    actualDate: null,
    startTime: null,
    endTime: null,
    status,
    objective: 'Presentar catalogo',
  });
}

function buildRequest(): Request {
  return { headers: { 'x-user-id': '20' } } as unknown as Request;
}

describe('VisitsController', () => {
  let controller: VisitsController;
  let mockGetAgenda: { execute: ReturnType<typeof vi.fn> };
  let mockGetById: { execute: ReturnType<typeof vi.fn> };
  let mockStart: { execute: ReturnType<typeof vi.fn> };
  let mockRegisterResult: { execute: ReturnType<typeof vi.fn> };
  let mockReschedule: { execute: ReturnType<typeof vi.fn> };
  let mockMarkNotVisited: { execute: ReturnType<typeof vi.fn> };
  let mockGetAttachments: { execute: ReturnType<typeof vi.fn> };
  let mockUploadAttachment: { execute: ReturnType<typeof vi.fn> };
  let mockCurrentAdvisor: { extract: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockGetAgenda = { execute: vi.fn().mockResolvedValue([buildVisit()]) };
    mockGetById = { execute: vi.fn().mockResolvedValue(buildVisit()) };
    mockStart = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.IN_PROGRESS)),
    };
    mockRegisterResult = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.VISITED)),
    };
    mockReschedule = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.RESCHEDULE)),
    };
    mockMarkNotVisited = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.NOT_VISITED)),
    };
    mockGetAttachments = {
      execute: vi.fn().mockResolvedValue([
        {
          id: 7,
          visitId: 1,
          key: 'visits/1/photo.png',
          originalName: 'photo.png',
          mimetype: 'image/png',
          size: 4,
          createdAt: new Date('2026-10-20T14:00:00.000Z'),
          url: 'https://example.test/photo.png',
        },
      ]),
    };
    mockUploadAttachment = {
      execute: vi.fn().mockResolvedValue({
        id: 7,
        visitId: 1,
        key: 'visits/1/photo.png',
        originalName: 'photo.png',
        mimetype: 'image/png',
        size: 4,
        createdAt: new Date('2026-10-20T14:00:00.000Z'),
        url: 'https://example.test/photo.png',
      }),
    };
    mockCurrentAdvisor = { extract: vi.fn().mockResolvedValue(20) };

    controller = new VisitsController(
      mockGetAgenda as unknown as GetVisitAgendaUseCase,
      mockGetById as unknown as GetVisitByIdUseCase,
      mockStart as unknown as StartVisitUseCase,
      mockRegisterResult as unknown as RegisterVisitResultUseCase,
      mockReschedule as unknown as RescheduleVisitUseCase,
      mockMarkNotVisited as unknown as MarkVisitNotVisitedUseCase,
      mockCurrentAdvisor as unknown as CurrentAdvisorProvider,
      mockGetAttachments as unknown as GetVisitAttachmentsUseCase,
      mockUploadAttachment as unknown as UploadVisitAttachmentUseCase,
    );
  });

  it('returns agenda summaries for the authenticated advisor', async () => {
    const result = await controller.getAgenda(buildRequest(), {
      period: 'day',
      date: '2026-10-20',
    });

    expect(mockCurrentAdvisor.extract).toHaveBeenCalledTimes(1);
    expect(mockGetAgenda.execute).toHaveBeenCalledWith(20, 'day', '2026-10-20');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(VisitSummaryResponseDto);
    expect(result[0].status).toBe(VisitStatus.PENDING);
  });

  it('returns visit details as a response dto', async () => {
    const result = await controller.getById(1, buildRequest());

    expect(mockGetById.execute).toHaveBeenCalledWith(1, 20);
    expect(result).toBeInstanceOf(VisitDetailResponseDto);
  });

  it('starts a visit through the use case', async () => {
    const result = await controller.start(1, buildRequest());

    expect(mockStart.execute).toHaveBeenCalledWith(1, 20);
    expect(result.status).toBe(VisitStatus.IN_PROGRESS);
  });

  it('registers a visit result through the use case', async () => {
    const result = await controller.registerResult(1, buildRequest(), {
      endTime: '10:30:00',
      observations: 'obs',
      results: [{ id: 1 }],
    });

    expect(mockRegisterResult.execute).toHaveBeenCalledWith(1, 20, {
      endTime: '10:30:00',
      observations: 'obs',
      results: [{ id: 1 }],
    });
    expect(result).toBeInstanceOf(VisitDetailResponseDto);
  });

  it('reschedules a visit through the use case for the current advisor', async () => {
    const result = await controller.reschedule(1, buildRequest(), {
      scheduledAt: '2026-10-22T14:30:00-05:00',
    });

    expect(mockCurrentAdvisor.extract).toHaveBeenCalledTimes(1);
    expect(mockReschedule.execute).toHaveBeenCalledWith(
      1,
      20,
      '2026-10-22T14:30:00-05:00',
    );
    expect(result.status).toBe(VisitStatus.RESCHEDULE);
  });

  it('marks a visit as not visited through the use case for the current advisor', async () => {
    const result = await controller.markNotVisited(1, buildRequest());

    expect(mockCurrentAdvisor.extract).toHaveBeenCalledTimes(1);
    expect(mockMarkNotVisited.execute).toHaveBeenCalledWith(1, 20);
    expect(result.status).toBe(VisitStatus.NOT_VISITED);
  });

  it('uploads an attachment for the current advisor and returns its response dto', async () => {
    const result = await controller.uploadAttachment(1, buildRequest(), {
      buffer: Buffer.from('data'),
      originalname: 'photo.png',
      mimetype: 'image/png',
    });

    expect(mockUploadAttachment.execute).toHaveBeenCalledWith(1, 20, {
      buffer: Buffer.from('data'),
      filename: 'photo.png',
      mimetype: 'image/png',
    });
    expect(result.url).toBe('https://example.test/photo.png');
  });

  it('rejects an upload request with no file', async () => {
    await expect(
      controller.uploadAttachment(1, buildRequest(), undefined),
    ).rejects.toThrow('A file is required.');
    expect(mockUploadAttachment.execute).not.toHaveBeenCalled();
  });

  it('lists attachments for the current advisor', async () => {
    const result = await controller.listAttachments(1, buildRequest());

    expect(mockGetAttachments.execute).toHaveBeenCalledWith(1, 20);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.test/photo.png');
  });
});
