import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { Visit } from '../../domain/visit.entity.js';

import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

import { InvalidVisitObservationsError } from '../../domain/errors/invalid-visit-observations.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

/** HU-26: records that a visit didn't happen and logs it. */
@Injectable()
export class MarkVisitNotVisitedUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(id: number, advisorId: number, reason?: string) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    let notVisited: Visit;

    try {
      notVisited = visit.markNotVisited(reason);
    } catch (error) {
      if (
        error instanceof InvalidVisitStatusError ||
        error instanceof InvalidVisitObservationsError
      ) {
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
      description: reason ? `Visit not done: ${reason}` : 'Visit not done',
      metadata: { clientId: saved.clientId },
    });

    return saved;
  }
}
