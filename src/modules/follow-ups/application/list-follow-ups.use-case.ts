import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { FollowUp } from '../domain/follow-up.entity.js';
import { FollowUpDao } from '../domain/dao/follow-up.dao.js';

@Injectable()
export class ListFollowUpsUseCase {
  constructor(
    private readonly followUpDao: FollowUpDao,
    private readonly visitDao: VisitDao,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
    includeCompleted = true,
  ): Promise<FollowUp[]> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const followUps = await this.followUpDao.findByVisitAndAdvisor(
      visitId,
      advisorId,
    );

    if (!includeCompleted) {
      return followUps.filter((item) => !item.completed);
    }

    return followUps;
  }

  async getAgenda(
    advisorId: number,
    date?: string,
    period: 'day' | 'week' = 'day',
  ): Promise<FollowUp[]> {
    const reference = this.parseDate(date);
    const { startDate, endDate } = this.resolveRange(period, reference);

    return this.followUpDao.findAll({
      advisorId,
      completed: false,
      startDate,
      endDate,
    });
  }

  private parseDate(date?: string): Date {
    if (!date) {
      return new Date();
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        "Agenda date must use the 'YYYY-MM-DD' format.",
      );
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new BadRequestException(
        'Agenda date is not a valid calendar date.',
      );
    }

    return parsed;
  }

  private resolveRange(period: 'day' | 'week', reference: Date) {
    if (period === 'day') {
      const startDate = new Date(reference);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(reference);
      endDate.setUTCHours(23, 59, 59, 999);

      return { startDate, endDate };
    }

    const daysSinceMonday = (reference.getUTCDay() + 6) % 7;
    const startDate = new Date(reference);
    startDate.setUTCDate(reference.getUTCDate() - daysSinceMonday);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
}
