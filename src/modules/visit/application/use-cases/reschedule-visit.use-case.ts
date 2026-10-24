import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { Visit } from '../../domain/visit.entity.js';

import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

import { InvalidVisitRescheduleDateError } from '../../domain/errors/invalid-visit-reschedule-date.error.js';

import { InvalidVisitObservationsError } from '../../domain/errors/invalid-visit-observations.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

export interface RescheduleVisitCommand {
  scheduledAt: Date;
  reason?: string;
}

/** HU-26: moves a pending visit to another date and logs it. */
@Injectable()
export class RescheduleVisitUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    id: number,
    advisorId: number,
    command: RescheduleVisitCommand,
  ) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const previousDate = visit.scheduledAt;
    let rescheduled: Visit;

    try {
      rescheduled = visit.reschedule(command.scheduledAt, command.reason);
    } catch (error) {
      if (
        error instanceof InvalidVisitStatusError ||
        error instanceof InvalidVisitRescheduleDateError ||
        error instanceof InvalidVisitObservationsError
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.visitDao.save(rescheduled);

    await this.activityLog.record({
      action: 'visit.rescheduled',
      entityType: 'visit',
      entityId: saved.id,
      actorId: advisorId,
      description: command.reason
        ? `Visit rescheduled: ${command.reason}`
        : 'Visit rescheduled',
      metadata: {
        clientId: saved.clientId,
        previousDate: previousDate.toISOString(),
        newDate: saved.scheduledAt.toISOString(),
      },
    });

    return saved;
  }
}
