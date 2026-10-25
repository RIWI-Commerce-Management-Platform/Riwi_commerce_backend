import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';

import type { Request } from 'express';

import { VisitsController } from './visit.controller.js';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { RescheduleVisitUseCase } from '../../application/use-cases/reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from '../../application/use-cases/mark-visit-not-visited.use-case.js';

import { RegisterCommercialOutcomeUseCase } from '../../application/use-cases/register-commercial-outcome.use-case.js';

import { CreateFollowUpUseCase } from '../../application/use-cases/create-follow-up.use-case.js';

import { UploadVisitAttachmentUseCase } from '../../application/use-cases/upload-visit-attachment.use-case.js';

import { ListVisitAttachmentsUseCase } from '../../application/use-cases/list-visit-attachments.use-case.js';

import { DeleteVisitAttachmentUseCase } from '../../application/use-cases/delete-visit-attachment.use-case.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { FollowUp, FollowUpStatus } from '../../domain/follow-up.entity.js';

import { VisitAttachment } from '../../domain/visit-attachment.entity.js';

import { CurrentAdvisorProvider } from '../../../../shared/auth/domain/current-advisor.provider.js';

import { VisitSummaryResponseDto } from '../dtos/visit-summary-response.dto.js';

import { VisitDetailResponseDto } from '../dtos/visit-detail-response.dto.js';

import { FollowUpResponseDto } from '../dtos/follow-up-response.dto.js';

import { VisitAttachmentResponseDto } from '../dtos/visit-attachment-response.dto.js';

type MockUseCase = { execute: ReturnType<typeof vi.fn> };

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
    objective: 'Present the catalog',
  });
}

function buildFollowUp() {
  return new FollowUp({
    id: 5,
    visitId: 1,
    clientId: 10,
    responsibleId: 20,
    createdById: 20,
    dueDate: new Date(2026, 9, 27),
    activity: 'Call back',
    observation: null,
    status: FollowUpStatus.PENDING,
    completedAt: null,
  });
}

function buildAttachment(mimeType = 'image/png') {
  return {
    attachment: new VisitAttachment({
      id: 7,
      visitId: 1,
      fileKey: 'visits/1/photo.png',
      originalName: 'photo.png',
      mimeType,
      size: 1024,
      uploadedById: 20,
      createdAt: new Date(2026, 9, 20),
    }),
    url: 'https://signed.example/photo.png',
  };
}

function buildRequest(): Request {
  return { user: { id: 20 } } as unknown as Request;
}

describe('VisitsController', () => {
  let controller: VisitsController;
  let mockGetAgenda: MockUseCase;
  let mockGetById: MockUseCase;
  let mockStart: MockUseCase;
  let mockRegisterResult: MockUseCase;
  let mockCurrentAdvisor: { extract: ReturnType<typeof vi.fn> };
  let mockReschedule: MockUseCase;
  let mockNotVisited: MockUseCase;
  let mockCommercialOutcome: MockUseCase;
  let mockCreateFollowUp: MockUseCase;
  let mockUpload: MockUseCase;
  let mockListAttachments: MockUseCase;
  let mockDeleteAttachment: MockUseCase;

  beforeEach(() => {
    mockGetAgenda = { execute: vi.fn().mockResolvedValue([buildVisit()]) };
    mockGetById = { execute: vi.fn().mockResolvedValue(buildVisit()) };
    mockStart = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.IN_PROGRESS)),
    };
    mockRegisterResult = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.VISITED)),
    };
    mockCurrentAdvisor = { extract: vi.fn().mockResolvedValue(20) };
    mockReschedule = { execute: vi.fn().mockResolvedValue(buildVisit()) };
    mockNotVisited = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.NOT_VISITED)),
    };
    mockCommercialOutcome = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.VISITED)),
    };
    mockCreateFollowUp = {
      execute: vi.fn().mockResolvedValue(buildFollowUp()),
    };
    mockUpload = { execute: vi.fn().mockResolvedValue(buildAttachment()) };
    mockListAttachments = {
      execute: vi
        .fn()
        .mockResolvedValue([
          buildAttachment(),
          buildAttachment('application/pdf'),
        ]),
    };
    mockDeleteAttachment = { execute: vi.fn().mockResolvedValue(undefined) };

    controller = new VisitsController(
      mockGetAgenda as unknown as GetVisitAgendaUseCase,
      mockGetById as unknown as GetVisitByIdUseCase,
      mockStart as unknown as StartVisitUseCase,
      mockRegisterResult as unknown as RegisterVisitResultUseCase,
      mockCurrentAdvisor as unknown as CurrentAdvisorProvider,
      mockReschedule as unknown as RescheduleVisitUseCase,
      mockNotVisited as unknown as MarkVisitNotVisitedUseCase,
      mockCommercialOutcome as unknown as RegisterCommercialOutcomeUseCase,
      mockCreateFollowUp as unknown as CreateFollowUpUseCase,
      mockUpload as unknown as UploadVisitAttachmentUseCase,
      mockListAttachments as unknown as ListVisitAttachmentsUseCase,
      mockDeleteAttachment as unknown as DeleteVisitAttachmentUseCase,
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

  it('defaults the agenda to the current day', async () => {
    await controller.getAgenda(buildRequest(), {});

    expect(mockGetAgenda.execute).toHaveBeenCalledWith(20, 'day', undefined);
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

  it('reschedules a visit converting the date string', async () => {
    const result = await controller.reschedule(1, buildRequest(), {
      scheduledAt: '2026-10-28T09:00:00.000Z',
      reason: 'Client asked for another day',
    });

    expect(mockReschedule.execute).toHaveBeenCalledWith(1, 20, {
      scheduledAt: new Date('2026-10-28T09:00:00.000Z'),
      reason: 'Client asked for another day',
    });
    expect(result).toBeInstanceOf(VisitDetailResponseDto);
  });

  it('marks a visit as not visited with the reason', async () => {
    const result = await controller.notVisited(1, buildRequest(), {
      reason: 'Store closed',
    });

    expect(mockNotVisited.execute).toHaveBeenCalledWith(1, 20, 'Store closed');
    expect(result.status).toBe(VisitStatus.NOT_VISITED);
  });

  it('records the commercial outcome of a visit', async () => {
    const result = await controller.commercialOutcome(1, buildRequest(), {
      quoteGenerated: true,
      orderGenerated: false,
    });

    expect(mockCommercialOutcome.execute).toHaveBeenCalledWith(1, 20, {
      quoteGenerated: true,
      orderGenerated: false,
    });
    expect(result).toBeInstanceOf(VisitDetailResponseDto);
  });

  it('schedules a follow-up from a visit', async () => {
    const result = await controller.scheduleFollowUp(1, buildRequest(), {
      dueDate: '2026-10-27',
      activity: 'Call back',
      observation: undefined,
      responsibleId: undefined,
    });

    expect(mockCreateFollowUp.execute).toHaveBeenCalledWith(1, 20, {
      dueDate: new Date('2026-10-27'),
      activity: 'Call back',
      observation: undefined,
      responsibleId: undefined,
    });
    expect(result).toBeInstanceOf(FollowUpResponseDto);
    expect(result.id).toBe(5);
  });

  it('rejects an attachment upload without a file', async () => {
    await expect(controller.attach(1, buildRequest())).rejects.toThrow(
      BadRequestException,
    );
    expect(mockUpload.execute).not.toHaveBeenCalled();
  });

  it('uploads an attachment and returns it with its signed url', async () => {
    const file = {
      buffer: Buffer.from('png'),
      originalname: 'photo.png',
      mimetype: 'image/png',
      size: 1024,
    };

    const result = await controller.attach(1, buildRequest(), file);

    expect(mockUpload.execute).toHaveBeenCalledWith(1, 20, file);
    expect(result).toBeInstanceOf(VisitAttachmentResponseDto);
    expect(result.url).toBe('https://signed.example/photo.png');
    expect(result.isImage).toBe(true);
  });

  it('lists the attachments of a visit', async () => {
    const result = await controller.attachments(1, buildRequest());

    expect(mockListAttachments.execute).toHaveBeenCalledWith(1, 20);
    expect(result).toHaveLength(2);
    expect(result[1].isImage).toBe(false);
  });

  it('removes an attachment from a visit', async () => {
    await controller.removeAttachment(1, 7, buildRequest());

    expect(mockDeleteAttachment.execute).toHaveBeenCalledWith(1, 7, 20);
  });
});
