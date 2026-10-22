import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { FollowUpDao } from '../domain/dao/follow-up.dao.js';
import { ListFollowUpsUseCase } from './list-follow-ups.use-case.js';

describe('ListFollowUpsUseCase', () => {
  const followUpDao: Partial<FollowUpDao> = {
    findAll: vi.fn().mockResolvedValue([]),
  };
  const visitDao: Partial<VisitDao> = {};
  const useCase = new ListFollowUpsUseCase(
    followUpDao as FollowUpDao,
    visitDao as VisitDao,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries pending follow-ups for Monday through Sunday', async () => {
    await useCase.getAgenda(7, '2026-10-25', 'week');

    expect(followUpDao.findAll).toHaveBeenCalledWith({
      advisorId: 7,
      completed: false,
      startDate: new Date('2026-10-19T00:00:00.000Z'),
      endDate: new Date('2026-10-25T23:59:59.999Z'),
    });
  });

  it('queries a single UTC day for the day agenda', async () => {
    await useCase.getAgenda(7, '2026-10-20', 'day');

    expect(followUpDao.findAll).toHaveBeenLastCalledWith({
      advisorId: 7,
      completed: false,
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      endDate: new Date('2026-10-20T23:59:59.999Z'),
    });
  });

  it('rejects an impossible calendar date without querying the DAO', async () => {
    await expect(
      useCase.getAgenda(7, '2026-02-31', 'day'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(followUpDao.findAll).not.toHaveBeenCalled();
  });
});
