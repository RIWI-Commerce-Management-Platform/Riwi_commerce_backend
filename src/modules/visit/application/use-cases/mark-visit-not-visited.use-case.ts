import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';
import { VisitDao } from '../../domain/dao/visit.dao.js';
import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

@Injectable()
export class MarkVisitNotVisitedUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(id: number, advisorId: number) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const previousStatus = visit.status;
    const scheduledAt = visit.scheduledAt.toISOString();

    let notVisited;

    try {
      notVisited = visit.markNotVisited();
    } catch (error) {
      if (error instanceof InvalidVisitStatusError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.visitDao.save(notVisited);

    await this.activityLog.record({
      action: 'visit.not_visited',
      entityType: 'visit',
      entityId: saved.id,
      actorId: advisorId,
      clientId: saved.clientId,
      description: 'Visit marked as not visited.',
      metadata: {
        previousStatus,
        newStatus: saved.status,
        previousScheduledAt: scheduledAt,
        newScheduledAt: saved.scheduledAt.toISOString(),
      },
    });

    return saved;
  }
}
