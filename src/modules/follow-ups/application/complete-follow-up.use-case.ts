import { Injectable, NotFoundException } from '@nestjs/common';

import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { FollowUp } from '../domain/follow-up.entity.js';
import { FollowUpDao } from '../domain/dao/follow-up.dao.js';

@Injectable()
export class CompleteFollowUpUseCase {
  constructor(
    private readonly followUpDao: FollowUpDao,
    private readonly activityLog: ActivityLogService,
    private readonly visitDao: VisitDao,
  ) {}

  async execute(id: number, advisorId: number): Promise<FollowUp> {
    const followUp = await this.followUpDao.findByIdAndAdvisor(id, advisorId);

    if (!followUp) {
      throw new NotFoundException('Follow-up not found.');
    }

    if (followUp.completed) {
      return followUp;
    }

    const visit = await this.visitDao.findByIdAndAdvisor(
      followUp.visitId,
      advisorId,
    );

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const completedFollowUp = followUp.markCompleted();
    const saved = await this.followUpDao.save(completedFollowUp);

    await this.activityLog.record({
      action: 'follow_up.completed',
      entityType: 'follow_up',
      entityId: saved.id,
      actorId: advisorId,
      clientId: visit.clientId,
      metadata: {
        visitId: saved.visitId,
        completed: true,
      },
    });

    return saved;
  }
}
