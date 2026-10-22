import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { Visit, VisitStatus } from '../../domain/visit.entity.js';
import { MarkVisitNotVisitedUseCase } from './mark-visit-not-visited.use-case.js';

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
    observations: status === VisitStatus.VISITED ? 'Historical result' : null,
    results:
      status === VisitStatus.VISITED
        ? [{ id: 1, name: 'Visita realizada' }]
        : [],
  });
}

describe('MarkVisitNotVisitedUseCase', () => {
  let useCase: MarkVisitNotVisitedUseCase;
  let visitDao: Partial<VisitDao>;
  let activityLog: Partial<ActivityLogService>;

  beforeEach(() => {
    visitDao = {
      findByIdAndAdvisor: vi.fn(),
      save: vi.fn().mockImplementation((visit: Visit) => Promise.resolve(visit)),
    };
    activityLog = { record: vi.fn().mockResolvedValue(undefined) };
    useCase = new MarkVisitNotVisitedUseCase(
      visitDao as VisitDao,
      activityLog as ActivityLogService,
    );
  });

  it('marks a pending visit and records the status transition', async () => {
    const scheduledAt = '2026-10-20T09:00:00.000Z';
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );

    const result = await useCase.execute(7, 20);

    expect(result.status).toBe(VisitStatus.NOT_VISITED);
    expect(result.scheduledAt.toISOString()).toBe(scheduledAt);
    expect(visitDao.save).toHaveBeenCalledWith(result);
    expect(activityLog.record).toHaveBeenCalledWith({
      action: 'visit.not_visited',
      entityType: 'visit',
      entityId: 7,
      actorId: 20,
      clientId: 12,
      description: 'Visit marked as not visited.',
      metadata: {
        previousStatus: VisitStatus.PENDING,
        newStatus: VisitStatus.NOT_VISITED,
        previousScheduledAt: scheduledAt,
        newScheduledAt: scheduledAt,
      },
    });
  });

  it('rejects a visit that does not exist or belong to the advisor', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(useCase.execute(7, 20)).rejects.toThrow(NotFoundException);
    expect(visitDao.save).not.toHaveBeenCalled();
    expect(activityLog.record).not.toHaveBeenCalled();
  });

  it('does not overwrite completed visit results or history', async () => {
    const completed = buildVisit(VisitStatus.VISITED);
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      completed,
    );

    await expect(useCase.execute(7, 20)).rejects.toThrow(BadRequestException);
    expect(visitDao.save).not.toHaveBeenCalled();
    expect(activityLog.record).not.toHaveBeenCalled();
    expect(completed.status).toBe(VisitStatus.VISITED);
    expect(completed.observations).toBe('Historical result');
    expect(completed.results).toEqual([
      { id: 1, name: 'Visita realizada' },
    ]);
  });

  it('propagates activity-log failures instead of returning success', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );
    (activityLog.record as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('activity log unavailable'),
    );

    await expect(useCase.execute(7, 20)).rejects.toThrow(
      'activity log unavailable',
    );
  });
});
