import { Injectable } from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

export type AgendaPeriod = 'day' | 'week';

@Injectable()
export class GetVisitAgendaUseCase {
  constructor(private readonly visitDao: VisitDao) {}

  async execute(advisorId: number, period: AgendaPeriod) {
    const now = new Date();

    let startDate: Date;
    let endDate: Date;

    if (period === 'day') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const day = now.getDay();

      const daysSinceMonday = (day + 6) % 7;

      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysSinceMonday);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      endDate.setMilliseconds(endDate.getMilliseconds() - 1);
    }

    return this.visitDao.findAgenda({
      advisorId,
      startDate,
      endDate,
    });
  }
}
