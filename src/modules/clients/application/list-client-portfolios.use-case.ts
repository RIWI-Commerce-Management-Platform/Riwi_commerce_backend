import { Injectable } from '@nestjs/common';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientPortfolioRepository } from '../domain/client-portfolio.repository.js';
import { ClientPortfolio } from '../domain/client-portfolio.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

@Injectable()
export class ListClientPortfoliosUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientPortfolioRepository: ClientPortfolioRepository,
  ) {}

  async execute(clientId: number): Promise<ClientPortfolio[]> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }
    return this.clientPortfolioRepository.findByClientId(clientId);
  }
}
