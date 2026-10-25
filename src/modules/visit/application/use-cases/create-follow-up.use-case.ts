import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { FollowUpDao } from '../../domain/dao/follow-up.dao.js';

import { FollowUp } from '../../domain/follow-up.entity.js';

import { InvalidFollowUpError } from '../../domain/errors/invalid-follow-up.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

export interface CreateFollowUpCommand {
  dueDate: Date;
  activity: string;
  observation?: string;
  /** Defaults to the advisor who owns the visit. */
  responsibleId?: number;
}

/** HU-25: schedules a follow-up from one of the advisor's visits. */
@Injectable()
export class CreateFollowUpUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly followUpDao: FollowUpDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
    command: CreateFollowUpCommand,
  ): Promise<FollowUp> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    let followUp: FollowUp;

    try {
      followUp = FollowUp.schedule({
        visitId: visit.id,
        clientId: visit.clientId,
        responsibleId: command.responsibleId ?? advisorId,
        createdById: advisorId,
        dueDate: command.dueDate,
        activity: command.activity,
        observation: command.observation ?? null,
      });
    } catch (error) {
      if (error instanceof InvalidFollowUpError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.followUpDao.save(followUp);

    await this.activityLog.record({
      action: 'follow_up.scheduled',
      entityType: 'follow_up',
      entityId: saved.id!,
      actorId: advisorId,
      clientId: saved.clientId,
      description: `Follow-up scheduled: ${saved.activity}`,
      metadata: {
        visitId: saved.visitId,
        dueDate: saved.dueDate.toISOString(),
        responsibleId: saved.responsibleId,
      },
    });

    return saved;
  }
}
