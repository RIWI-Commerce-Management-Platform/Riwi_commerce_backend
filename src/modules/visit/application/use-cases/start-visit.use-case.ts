import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

@Injectable()
export class StartVisitUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    id: number,
    advisorId: number | null,
    actorId: number | string = advisorId ?? 0,
  ) {
    const visit =
      advisorId === null
        ? await this.visitDao.findById(id)
        : await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    let startedVisit;

    try {
      startedVisit = visit.start();
    } catch (error) {
      if (error instanceof InvalidVisitStatusError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.visitDao.save(startedVisit);

    await this.activityLog.record({
      action: 'visit.started',
      entityType: 'visit',
      entityId: saved.id,
      actorId,
      metadata: { clientId: saved.clientId },
    });

    return saved;
  }
}
