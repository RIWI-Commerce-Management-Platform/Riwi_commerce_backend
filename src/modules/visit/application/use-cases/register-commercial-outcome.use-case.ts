import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { Visit } from '../../domain/visit.entity.js';

import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

export interface CommercialOutcomeCommand {
  quoteGenerated: boolean;
  orderGenerated: boolean;
}

/**
 * HU-27: the "Commercial management" section of the visit form. When the
 * advisor marks "yes", the frontend opens the quote form with the visit's
 * client and sends `visitId` with the new quote.
 */
@Injectable()
export class RegisterCommercialOutcomeUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    id: number,
    advisorId: number,
    command: CommercialOutcomeCommand,
  ) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    let updated: Visit;

    try {
      updated = visit.registerCommercialOutcome(command);
    } catch (error) {
      if (error instanceof InvalidVisitStatusError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.visitDao.save(updated);

    await this.activityLog.record({
      action: 'visit.commercial_outcome',
      entityType: 'visit',
      entityId: saved.id,
      actorId: advisorId,
      description: `Quote generated: ${command.quoteGenerated ? 'yes' : 'no'}, order generated: ${command.orderGenerated ? 'yes' : 'no'}`,
      metadata: {
        clientId: saved.clientId,
        quoteGenerated: command.quoteGenerated,
        orderGenerated: command.orderGenerated,
      },
    });

    return saved;
  }
}
