import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { Visit, VisitStatus } from '../../domain/visit.entity.js';
import { RescheduleVisitUseCase } from './reschedule-visit.use-case.js';

function buildVisit(status = VisitStatus.PENDING) {
  return new Visit({
    id: 7,
    clientId: 12,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date('2026-10-20T09:00:00.000Z'),
    actualDate: null,
    startTime: null,
    endTime: null,
    status,
    objective: 'Presentar catálogo',
  });
}

describe('RescheduleVisitUseCase', () => {
  let useCase: RescheduleVisitUseCase;
  let visitDao: Partial<VisitDao>;
  let activityLog: Partial<ActivityLogService>;

  beforeEach(() => {
    visitDao = {
      findByIdAndAdvisor: vi.fn(),
      save: vi.fn().mockImplementation((visit: Visit) => Promise.resolve(visit)),
    };
    activityLog = { record: vi.fn().mockResolvedValue(undefined) };
    useCase = new RescheduleVisitUseCase(
      visitDao as VisitDao,
      activityLog as ActivityLogService,
    );
  });

  it('persists the new date and status and records the full audit event', async () => {
    const previousDate = new Date('2026-10-20T09:00:00.000Z');
    const newDate = '2026-10-22T14:30:00-05:00';
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );

    const result = await useCase.execute(7, 20, newDate);

    expect(result.status).toBe(VisitStatus.RESCHEDULE);
    expect(result.scheduledAt).toEqual(new Date(newDate));
    expect(visitDao.save).toHaveBeenCalledWith(result);
    expect(activityLog.record).toHaveBeenCalledWith({
      action: 'visit.rescheduled',
      entityType: 'visit',
      entityId: 7,
      actorId: 20,
      clientId: 12,
      description: `Visit rescheduled from ${previousDate.toISOString()} to ${new Date(newDate).toISOString()}.`,
      metadata: {
        previousStatus: VisitStatus.PENDING,
        newStatus: VisitStatus.RESCHEDULE,
        previousScheduledAt: previousDate.toISOString(),
        newScheduledAt: new Date(newDate).toISOString(),
      },
    });
  });

  it('rejects a visit that does not exist or belong to the advisor', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute(7, 20, '2026-10-22T14:30:00-05:00'),
    ).rejects.toThrow(NotFoundException);
    expect(visitDao.save).not.toHaveBeenCalled();
    expect(activityLog.record).not.toHaveBeenCalled();
  });

  it('rejects invalid dates and transitions without persisting or logging', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(VisitStatus.VISITED),
    );

    await expect(
      useCase.execute(7, 20, '2026-10-22T14:30:00-05:00'),
    ).rejects.toThrow(BadRequestException);
    expect(visitDao.save).not.toHaveBeenCalled();
    expect(activityLog.record).not.toHaveBeenCalled();
  });

  it('rejects an invalid date even when called without the HTTP validation pipe', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );

    await expect(useCase.execute(7, 20, 'not-a-date')).rejects.toThrow(
      BadRequestException,
    );
    expect(visitDao.save).not.toHaveBeenCalled();
    expect(activityLog.record).not.toHaveBeenCalled();
  });

  it('propagates activity-log failures instead of returning success', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );
    (activityLog.record as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('activity log unavailable'),
    );

    await expect(
      useCase.execute(7, 20, '2026-10-22T14:30:00-05:00'),
    ).rejects.toThrow('activity log unavailable');
  });
});
