import { Injectable } from '@nestjs/common';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientPortfolioRepository } from '../domain/client-portfolio.repository.js';
import { ClientPortfolio } from '../domain/client-portfolio.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import {
  ClientPortfolioAlreadyAssignedError,
  PortfolioNotFoundError,
} from '../domain/client-portfolio.errors.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface AddClientPortfolioInput {
  clientId: number;
  portfolioId: number;
  actorId: number;
}

/** Associates an active portfolio with a client (HU-16). */
@Injectable()
export class AddClientPortfolioUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientPortfolioRepository: ClientPortfolioRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: AddClientPortfolioInput): Promise<ClientPortfolio> {
    const client = await this.clientRepository.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    const portfolio = await this.clientPortfolioRepository.findPortfolio(
      input.portfolioId,
    );
    if (!portfolio || !portfolio.isActive) {
      throw new PortfolioNotFoundError(input.portfolioId);
    }

    const existing = await this.clientPortfolioRepository.findOne(
      input.clientId,
      input.portfolioId,
    );
    if (existing) {
      throw new ClientPortfolioAlreadyAssignedError(
        input.clientId,
        input.portfolioId,
      );
    }

    const saved = await this.clientPortfolioRepository.save(
      new ClientPortfolio({
        clientId: input.clientId,
        portfolioId: input.portfolioId,
        portfolioName: portfolio.name,
        registeredAt: new Date(),
      }),
    );

    await this.activityLog.record({
      action: 'client.portfolio_added',
      entityType: 'client',
      entityId: input.clientId,
      clientId: input.clientId,
      actorId: input.actorId,
      description: `Portfolio "${portfolio.name}" added`,
      metadata: { portfolioId: input.portfolioId },
    });

    return saved;
  }
}
