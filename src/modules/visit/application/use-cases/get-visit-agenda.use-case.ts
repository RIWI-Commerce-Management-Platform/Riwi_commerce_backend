import { Injectable } from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import {
  AgendaPeriod,
  parseAgendaDate,
  resolveAgendaRange,
} from './agenda-range.js';

export type { AgendaPeriod } from './agenda-range.js';

@Injectable()
export class GetVisitAgendaUseCase {
  constructor(private readonly visitDao: VisitDao) {}

  async execute(advisorId: number, period: AgendaPeriod, date?: string) {
    const { startDate, endDate } = resolveAgendaRange(
      period,
      parseAgendaDate(date),
    );

    return this.visitDao.findAgenda({
      advisorId,
      startDate,
      endDate,
    });
  }
}
