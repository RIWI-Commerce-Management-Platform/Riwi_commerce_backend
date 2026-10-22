import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { InvalidVisitScheduledAtError } from '../../domain/errors/invalid-visit-scheduled-at.error.js';
import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

@Injectable()
export class RescheduleVisitUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(id: number, advisorId: number, scheduledAt: string) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const previousStatus = visit.status;
    const previousScheduledAt = visit.scheduledAt;
    const parsedScheduledAt = new Date(scheduledAt);

    let rescheduledVisit;

    try {
      rescheduledVisit = visit.reschedule(parsedScheduledAt);
    } catch (error) {
      if (
        error instanceof InvalidVisitStatusError ||
        error instanceof InvalidVisitScheduledAtError
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.visitDao.save(rescheduledVisit);

    await this.activityLog.record({
      action: 'visit.rescheduled',
      entityType: 'visit',
      entityId: saved.id,
      actorId: advisorId,
      clientId: saved.clientId,
      description: `Visit rescheduled from ${previousScheduledAt.toISOString()} to ${saved.scheduledAt.toISOString()}.`,
      metadata: {
        previousStatus,
        newStatus: saved.status,
        previousScheduledAt: previousScheduledAt.toISOString(),
        newScheduledAt: saved.scheduledAt.toISOString(),
      },
    });

    return saved;
  }
}
