import { describe, expect, it, vi, beforeEach } from 'vitest';

import { BadRequestException } from '@nestjs/common';

import { GetVisitAgendaUseCase } from './get-visit-agenda.use-case.js';

import { VisitDao } from '../../domain/dao/visit.dao.js';

describe('GetVisitAgendaUseCase', () => {
  let useCase: GetVisitAgendaUseCase;
  let mockVisitDao: Partial<VisitDao>;

  beforeEach(() => {
    mockVisitDao = {
      findAgenda: vi.fn().mockResolvedValue([]),
    };

    useCase = new GetVisitAgendaUseCase(mockVisitDao as VisitDao);
  });

  it('queries a single day between 00:00 and 23:59:59.999 of the given date', async () => {
    await useCase.execute(1, 'day', '2026-10-20');

    expect(mockVisitDao.findAgenda).toHaveBeenCalledWith({
      advisorId: 1,
      startDate: new Date(2026, 9, 20, 0, 0, 0, 0),
      endDate: new Date(2026, 9, 20, 23, 59, 59, 999),
    });
  });

  it('queries a full week from Monday to Sunday of the week containing the date', async () => {
    // 2026-10-21 is a Wednesday; its week runs Monday 2026-10-19 to Sunday 2026-10-25.
    await useCase.execute(1, 'week', '2026-10-21');

    expect(mockVisitDao.findAgenda).toHaveBeenCalledWith({
      advisorId: 1,
      startDate: new Date(2026, 9, 19, 0, 0, 0, 0),
      endDate: new Date(2026, 9, 25, 23, 59, 59, 999),
    });
  });

  it('uses a Monday-start week when the reference date is a Sunday', async () => {
    // 2026-10-25 is a Sunday; its week still starts on Monday 2026-10-19.
    await useCase.execute(1, 'week', '2026-10-25');

    expect(mockVisitDao.findAgenda).toHaveBeenCalledWith({
      advisorId: 1,
      startDate: new Date(2026, 9, 19, 0, 0, 0, 0),
      endDate: new Date(2026, 9, 25, 23, 59, 59, 999),
    });
  });

  it('rejects a date that does not use the YYYY-MM-DD format', async () => {
    await expect(useCase.execute(1, 'day', '20-10-2026')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a date that is not a real calendar date', async () => {
    await expect(useCase.execute(1, 'day', '2026-02-30')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('filters the agenda by the given advisor', async () => {
    await useCase.execute(42, 'day', '2026-10-20');

    const filters = (mockVisitDao.findAgenda as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

    expect(filters.advisorId).toBe(42);
  });

  it('defaults to current date when date parameter is omitted', async () => {
    await useCase.execute(1, 'day');
    expect(mockVisitDao.findAgenda).toHaveBeenCalled();
  });
});
