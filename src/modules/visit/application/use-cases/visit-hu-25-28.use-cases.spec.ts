import { describe, expect, it, vi } from 'vitest';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { FollowUp, FollowUpStatus } from '../../domain/follow-up.entity.js';

import { VisitAttachment } from '../../domain/visit-attachment.entity.js';

import { RescheduleVisitUseCase } from './reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from './mark-visit-not-visited.use-case.js';

import { RegisterCommercialOutcomeUseCase } from './register-commercial-outcome.use-case.js';

import { CreateFollowUpUseCase } from './create-follow-up.use-case.js';

import { GetFollowUpAgendaUseCase } from './get-follow-up-agenda.use-case.js';

import { CompleteFollowUpUseCase } from './complete-follow-up.use-case.js';

import { UploadVisitAttachmentUseCase } from './upload-visit-attachment.use-case.js';

import { ListVisitAttachmentsUseCase } from './list-visit-attachments.use-case.js';

import { DeleteVisitAttachmentUseCase } from './delete-visit-attachment.use-case.js';

import { InvalidFileTypeError } from '../../../../shared/file-storage/domain/errors/invalid-file-type.error.js';

const buildVisit = (status = VisitStatus.PENDING) =>
  new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 0, 1),
    actualDate: null,
    startTime: null,
    endTime: null,
    status,
    objective: null,
  });

const visitDaoWith = (visit: Visit | null) => ({
  findByIdAndAdvisor: vi.fn().mockResolvedValue(visit),
  save: vi.fn(async (v: Visit) => v),
});

const activityLog = () => ({ record: vi.fn() });

describe('RescheduleVisitUseCase', () => {
  it('reschedules and logs the change', async () => {
    const log = activityLog();
    const useCase = new RescheduleVisitUseCase(
      visitDaoWith(buildVisit()) as any,
      log as any,
    );
    const future = new Date(Date.now() + 86_400_000);

    const visit = await useCase.execute(1, 20, {
      scheduledAt: future,
      reason: 'Asked',
    });

    expect(visit.status).toBe(VisitStatus.RESCHEDULE);
    expect(log.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'visit.rescheduled', actorId: 20 }),
    );
  });

  it('maps domain errors to 400 and a missing visit to 404', async () => {
    const pastUseCase = new RescheduleVisitUseCase(
      visitDaoWith(buildVisit()) as any,
      activityLog() as any,
    );
    await expect(
      pastUseCase.execute(1, 20, { scheduledAt: new Date(2000, 0, 1) }),
    ).rejects.toThrow(BadRequestException);

    const missing = new RescheduleVisitUseCase(
      visitDaoWith(null) as any,
      activityLog() as any,
    );
    await expect(
      missing.execute(1, 20, { scheduledAt: new Date() }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('MarkVisitNotVisitedUseCase', () => {
  it('marks the visit and logs it', async () => {
    const log = activityLog();
    const useCase = new MarkVisitNotVisitedUseCase(
      visitDaoWith(buildVisit()) as any,
      log as any,
    );

    const visit = await useCase.execute(1, 20, 'Closed');

    expect(visit.status).toBe(VisitStatus.NOT_VISITED);
    expect(log.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'visit.not_visited' }),
    );
  });

  it('rejects a visit that was already done', async () => {
    const useCase = new MarkVisitNotVisitedUseCase(
      visitDaoWith(buildVisit(VisitStatus.VISITED)) as any,
      activityLog() as any,
    );
    await expect(useCase.execute(1, 20)).rejects.toThrow(BadRequestException);
  });

  it('fails for a visit of another advisor', async () => {
    const useCase = new MarkVisitNotVisitedUseCase(
      visitDaoWith(null) as any,
      activityLog() as any,
    );
    await expect(useCase.execute(1, 20)).rejects.toThrow(NotFoundException);
  });
});

describe('RegisterCommercialOutcomeUseCase', () => {
  it('stores the outcome and logs it', async () => {
    const log = activityLog();
    const useCase = new RegisterCommercialOutcomeUseCase(
      visitDaoWith(buildVisit(VisitStatus.VISITED)) as any,
      log as any,
    );

    const visit = await useCase.execute(1, 20, {
      quoteGenerated: true,
      orderGenerated: false,
    });

    expect(visit.quoteGenerated).toBe(true);
    expect(log.record).toHaveBeenCalled();
  });

  it('rejects a visit that has not started', async () => {
    const useCase = new RegisterCommercialOutcomeUseCase(
      visitDaoWith(buildVisit()) as any,
      activityLog() as any,
    );
    await expect(
      useCase.execute(1, 20, { quoteGenerated: true, orderGenerated: false }),
    ).rejects.toThrow(BadRequestException);
  });

  it('fails for a missing visit', async () => {
    const useCase = new RegisterCommercialOutcomeUseCase(
      visitDaoWith(null) as any,
      activityLog() as any,
    );
    await expect(
      useCase.execute(1, 20, { quoteGenerated: false, orderGenerated: false }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('Follow-up use cases (HU-25)', () => {
  const followUpDao = () => ({
    save: vi.fn(async (f: FollowUp) => new FollowUp({ ...f.toJSON(), id: 3 })),
    findById: vi.fn(),
    findAgenda: vi.fn(),
  });

  it('schedules a follow-up for the visit client, owned by the advisor', async () => {
    const dao = followUpDao();
    const log = activityLog();
    const useCase = new CreateFollowUpUseCase(
      visitDaoWith(buildVisit()) as any,
      dao as any,
      log as any,
    );

    const followUp = await useCase.execute(1, 20, {
      dueDate: new Date(2026, 9, 25),
      activity: 'Call',
    });

    expect(followUp).toMatchObject({
      id: 3,
      clientId: 10,
      responsibleId: 20,
      visitId: 1,
    });
    expect(log.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'follow_up.scheduled', clientId: 10 }),
    );
  });

  it('rejects invalid data and unknown visits', async () => {
    const invalid = new CreateFollowUpUseCase(
      visitDaoWith(buildVisit()) as any,
      followUpDao() as any,
      activityLog() as any,
    );
    await expect(
      invalid.execute(1, 20, { dueDate: new Date(), activity: ' ' }),
    ).rejects.toThrow(BadRequestException);

    const missing = new CreateFollowUpUseCase(
      visitDaoWith(null) as any,
      followUpDao() as any,
      activityLog() as any,
    );
    await expect(
      missing.execute(1, 20, { dueDate: new Date(), activity: 'Call' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns the week agenda with client names', async () => {
    const dao = followUpDao();
    dao.findAgenda.mockResolvedValue([
      FollowUp.schedule({
        id: 3,
        visitId: 1,
        clientId: 10,
        responsibleId: 20,
        createdById: 20,
        dueDate: new Date(2026, 9, 21),
        activity: 'Call',
        observation: null,
      }),
    ]);
    const clientReader = {
      findById: vi.fn().mockResolvedValue({ id: 10, name: 'Tienda' }),
    };
    const useCase = new GetFollowUpAgendaUseCase(
      dao as any,
      clientReader as any,
    );

    const agenda = await useCase.execute(
      20,
      'week',
      '2026-10-21',
      FollowUpStatus.PENDING,
    );

    expect(agenda[0].clientName).toBe('Tienda');
    const filters = dao.findAgenda.mock.calls[0][0];
    expect(filters.responsibleId).toBe(20);
    expect(filters.status).toBe(FollowUpStatus.PENDING);
    expect(filters.startDate.getDay()).toBe(1);
  });

  it('completes a follow-up of the user and hides the others', async () => {
    const pending = FollowUp.schedule({
      id: 3,
      visitId: 1,
      clientId: 10,
      responsibleId: 20,
      createdById: 20,
      dueDate: new Date(),
      activity: 'Call',
      observation: null,
    });
    const dao = followUpDao();
    dao.findById.mockResolvedValue(pending);
    const useCase = new CompleteFollowUpUseCase(
      dao as any,
      activityLog() as any,
    );

    await expect(useCase.execute(3, 20)).resolves.toMatchObject({
      status: FollowUpStatus.COMPLETED,
    });
    await expect(useCase.execute(3, 99)).rejects.toThrow(NotFoundException);
  });

  it('rejects completing twice', async () => {
    const dao = followUpDao();
    dao.findById.mockResolvedValue(
      new FollowUp({
        id: 3,
        visitId: null,
        clientId: 10,
        responsibleId: 20,
        createdById: 20,
        dueDate: new Date(),
        activity: 'Call',
        observation: null,
        status: FollowUpStatus.COMPLETED,
        completedAt: new Date(),
      }),
    );
    const useCase = new CompleteFollowUpUseCase(
      dao as any,
      activityLog() as any,
    );

    await expect(useCase.execute(3, 20)).rejects.toThrow(BadRequestException);
  });
});

describe('Visit attachment use cases (HU-28)', () => {
  const file = {
    buffer: Buffer.from('img'),
    originalname: 'front.jpg',
    mimetype: 'image/jpeg',
    size: 3,
  };
  const attachment = new VisitAttachment({
    id: 4,
    visitId: 1,
    fileKey: 'visits/1/front.jpg',
    originalName: 'front.jpg',
    mimeType: 'image/jpeg',
    size: 3,
    uploadedById: 20,
  });
  const storage = () => ({
    upload: vi.fn().mockResolvedValue({
      key: 'visits/1/front.jpg',
      originalName: 'front.jpg',
      mimetype: 'image/jpeg',
      size: 3,
    }),
    getPresignedUrl: vi.fn().mockResolvedValue('https://signed'),
    delete: vi.fn(),
  });
  const attachmentDao = () => ({
    save: vi.fn().mockResolvedValue(attachment),
    findByVisitId: vi.fn().mockResolvedValue([attachment]),
    findById: vi.fn().mockResolvedValue(attachment),
    delete: vi.fn(),
  });

  it('uploads to the visit folder and returns a signed url', async () => {
    const files = storage();
    const useCase = new UploadVisitAttachmentUseCase(
      visitDaoWith(buildVisit()) as any,
      attachmentDao() as any,
      files as any,
      activityLog() as any,
    );

    const result = await useCase.execute(1, 20, file);

    expect(files.upload).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'visits/1', mimetype: 'image/jpeg' }),
    );
    expect(result.url).toBe('https://signed');
    expect(result.attachment.isImage).toBe(true);
  });

  it('maps an invalid file to 400', async () => {
    const files = storage();
    files.upload.mockRejectedValue(new InvalidFileTypeError('text/x', []));
    const useCase = new UploadVisitAttachmentUseCase(
      visitDaoWith(buildVisit()) as any,
      attachmentDao() as any,
      files as any,
      activityLog() as any,
    );

    await expect(useCase.execute(1, 20, file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lists the files with signed urls', async () => {
    const useCase = new ListVisitAttachmentsUseCase(
      visitDaoWith(buildVisit()) as any,
      attachmentDao() as any,
      storage() as any,
    );

    const results = await useCase.execute(1, 20);

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://signed');
  });

  it('deletes the file from S3 and the database', async () => {
    const files = storage();
    const dao = attachmentDao();
    const useCase = new DeleteVisitAttachmentUseCase(
      visitDaoWith(buildVisit()) as any,
      dao as any,
      files as any,
      activityLog() as any,
    );

    await useCase.execute(1, 4, 20);

    expect(files.delete).toHaveBeenCalledWith('visits/1/front.jpg');
    expect(dao.delete).toHaveBeenCalledWith(4);
  });

  it('does not delete a file of another visit', async () => {
    const useCase = new DeleteVisitAttachmentUseCase(
      visitDaoWith(buildVisit()) as any,
      attachmentDao() as any,
      storage() as any,
      activityLog() as any,
    );

    await expect(useCase.execute(2, 4, 20)).rejects.toThrow(NotFoundException);
  });

  it('rejects uploads and listings for unknown visits', async () => {
    const upload = new UploadVisitAttachmentUseCase(
      visitDaoWith(null) as any,
      attachmentDao() as any,
      storage() as any,
      activityLog() as any,
    );
    const list = new ListVisitAttachmentsUseCase(
      visitDaoWith(null) as any,
      attachmentDao() as any,
      storage() as any,
    );

    await expect(upload.execute(1, 20, file)).rejects.toThrow(
      NotFoundException,
    );
    await expect(list.execute(1, 20)).rejects.toThrow(NotFoundException);
  });
});
