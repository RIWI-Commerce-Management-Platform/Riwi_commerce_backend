import { Injectable } from '@nestjs/common';
import { ClientPortfolioDao } from '../domain/client-portfolio.dao.js';
import { ClientPortfolioNotFoundError } from '../domain/client-portfolio.errors.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface RemoveClientPortfolioInput {
  clientId: number;
  portfolioId: number;
  actorId: number;
}

/** Removes a portfolio from a client (HU-16). */
@Injectable()
export class RemoveClientPortfolioUseCase {
  constructor(
    private readonly clientPortfolioDao: ClientPortfolioDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: RemoveClientPortfolioInput): Promise<void> {
    const existing = await this.clientPortfolioDao.findOne(
      input.clientId,
      input.portfolioId,
    );
    if (!existing) {
      throw new ClientPortfolioNotFoundError(input.clientId, input.portfolioId);
    }

    await this.clientPortfolioDao.delete(input.clientId, input.portfolioId);

    await this.activityLog.record({
      action: 'client.portfolio_removed',
      entityType: 'client',
      entityId: input.clientId,
      clientId: input.clientId,
      actorId: input.actorId,
      description: `Portfolio "${existing.portfolioName ?? input.portfolioId}" removed`,
      metadata: { portfolioId: input.portfolioId },
    });
  }
}
