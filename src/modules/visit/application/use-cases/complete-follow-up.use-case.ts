import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FollowUpDao } from '../../domain/dao/follow-up.dao.js';

import { FollowUp } from '../../domain/follow-up.entity.js';

import { InvalidFollowUpError } from '../../domain/errors/invalid-follow-up.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

/** HU-25: marks a follow-up as completed by its responsible or its creator. */
@Injectable()
export class CompleteFollowUpUseCase {
  constructor(
    private readonly followUpDao: FollowUpDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(id: number, userId: number): Promise<FollowUp> {
    const followUp = await this.followUpDao.findById(id);

    if (
      !followUp ||
      (followUp.responsibleId !== userId && followUp.createdById !== userId)
    ) {
      throw new NotFoundException('Follow-up not found.');
    }

    let completed: FollowUp;

    try {
      completed = followUp.complete();
    } catch (error) {
      if (error instanceof InvalidFollowUpError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.followUpDao.save(completed);

    await this.activityLog.record({
      action: 'follow_up.completed',
      entityType: 'follow_up',
      entityId: saved.id!,
      actorId: userId,
      clientId: saved.clientId,
      description: `Follow-up completed: ${saved.activity}`,
    });

    return saved;
  }
}
