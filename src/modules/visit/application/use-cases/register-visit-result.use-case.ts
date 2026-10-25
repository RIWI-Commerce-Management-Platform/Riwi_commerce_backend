import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { VisitResultCatalogDao } from '../../domain/dao/visit-result-catalog.dao.js';

import { VisitResult, Visit } from '../../domain/visit.entity.js';

import { EmptyVisitResultsError } from '../../domain/errors/empty-visit-results.error.js';

import { InvalidVisitObservationsError } from '../../domain/errors/invalid-visit-observations.error.js';

import { InvalidVisitStatusError } from '../../domain/errors/invalid-visit-status.error.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

export interface RegisterVisitResultCommand {
  endTime: string;
  observations: string;
  results: {
    id: number;
    observation?: string;
  }[];
}

@Injectable()
export class RegisterVisitResultUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly visitResultCatalogDao: VisitResultCatalogDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(
    id: number,
    advisorId: number,
    data: RegisterVisitResultCommand,
  ) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const results = await this.resolveResults(data.results);

    let completedVisit: Visit;

    try {
      completedVisit = visit.registerResult({
        endTime: data.endTime,
        observations: data.observations,
        results,
      });
    } catch (error) {
      if (
        error instanceof InvalidVisitStatusError ||
        error instanceof EmptyVisitResultsError ||
        error instanceof InvalidVisitObservationsError
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const saved = await this.visitDao.save(completedVisit);

    await this.activityLog.record({
      action: 'visit.result_registered',
      entityType: 'visit',
      entityId: saved.id,
      actorId: advisorId,
      metadata: {
        clientId: saved.clientId,
        resultIds: results.map((result) => result.id),
      },
    });

    return saved;
  }

  private async resolveResults(
    requested: { id: number; observation?: string }[],
  ): Promise<VisitResult[]> {
    if (requested.length === 0) {
      throw new BadRequestException('At least one visit result is required.');
    }

    const uniqueIds = [...new Set(requested.map((item) => item.id))];
    const options = await this.visitResultCatalogDao.findByIds(uniqueIds);

    const optionById = new Map(options.map((option) => [option.id, option]));

    const invalidIds = uniqueIds.filter(
      (resultId) => !optionById.has(resultId),
    );

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid or inactive visit result ids: ${invalidIds.join(', ')}.`,
      );
    }

    return requested.map((item) => {
      const option = optionById.get(item.id);

      return {
        id: item.id,
        name: option?.name ?? '',
        observation: item.observation,
      };
    });
  }
}
