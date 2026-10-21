import { describe, expect, it, vi, beforeEach } from 'vitest';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { StartVisitUseCase } from './start-visit.use-case.js';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

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

describe('StartVisitUseCase', () => {
  let useCase: StartVisitUseCase;
  let mockVisitDao: Partial<VisitDao>;
  let mockActivityLog: Partial<ActivityLogService>;

  beforeEach(() => {
    mockVisitDao = {
      findByIdAndAdvisor: vi.fn(),
      save: vi.fn().mockImplementation((visit: Visit) => Promise.resolve(visit)),
    };
    mockActivityLog = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new StartVisitUseCase(
      mockVisitDao as VisitDao,
      mockActivityLog as ActivityLogService,
    );
  });

  it('starts a pending visit and persists the transition', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );

    const result = await useCase.execute(1, 20);

    expect(result.status).toBe(VisitStatus.IN_PROGRESS);
    expect(result.startTime).not.toBeNull();
    expect(mockVisitDao.save).toHaveBeenCalledTimes(1);
  });

  it('records the visit start in the activity log', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );

    await useCase.execute(1, 20);

    expect(mockActivityLog.record).toHaveBeenCalledWith({
      action: 'visit.started',
      entityType: 'visit',
      entityId: 1,
      actorId: 20,
      metadata: { clientId: 10 },
    });
  });

  it('throws NotFound when the visit does not exist or belongs to another advisor', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(useCase.execute(1, 20)).rejects.toThrow(NotFoundException);
  });

  it('rejects starting a visit that is not pending', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(VisitStatus.IN_PROGRESS),
    );

    await expect(useCase.execute(1, 20)).rejects.toThrow(BadRequestException);
    expect(mockVisitDao.save).not.toHaveBeenCalled();
    expect(mockActivityLog.record).not.toHaveBeenCalled();
  });

  it('propagates persistence errors instead of masking them as bad requests', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );
    (mockVisitDao.save as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(useCase.execute(1, 20)).rejects.toThrow('database unavailable');
    expect(mockActivityLog.record).not.toHaveBeenCalled();
  });
});
