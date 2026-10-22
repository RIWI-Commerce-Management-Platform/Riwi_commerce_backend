import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { FollowUp } from '../domain/follow-up.entity.js';
import { FollowUpDao } from '../domain/dao/follow-up.dao.js';

export interface CreateFollowUpCommand {
  nextDate: string;
  activity: string;
  observation?: string;
}

@Injectable()
export class CreateFollowUpUseCase {
  constructor(
    private readonly followUpDao: FollowUpDao,
    private readonly activityLog: ActivityLogService,
    private readonly visitDao: VisitDao,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
    data: CreateFollowUpCommand,
  ): Promise<FollowUp> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const nextDate = this.parseDate(data.nextDate);

    if (!data.activity || !data.activity.trim()) {
      throw new BadRequestException('Activity is required.');
    }

    if (data.activity.trim().length > 150) {
      throw new BadRequestException('Activity must not exceed 150 characters.');
    }

    if (data.observation && data.observation.trim().length > 500) {
      throw new BadRequestException(
        'Observation must not exceed 500 characters.',
      );
    }

    const followUp = new FollowUp({
      id: 0,
      visitId,
      nextDate,
      activity: data.activity.trim(),
      observation: data.observation?.trim() ?? null,
      responsibleAdvisorId: advisorId,
      completed: false,
    });

    const saved = await this.followUpDao.create(followUp);

    await this.activityLog.record({
      action: 'follow_up.created',
      entityType: 'follow_up',
      entityId: saved.id,
      actorId: advisorId,
      clientId: visit.clientId,
      metadata: {
        visitId: saved.visitId,
        responsibleAdvisorId: saved.responsibleAdvisorId,
      },
    });

    return saved;
  }

  private parseDate(date: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        "Next date must use the 'YYYY-MM-DD' format.",
      );
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new BadRequestException('Next date is not a valid calendar date.');
    }

    return parsed;
  }
}
