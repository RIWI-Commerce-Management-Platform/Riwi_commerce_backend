import { Injectable } from '@nestjs/common';
import { ClientDao } from '../domain/client.dao.js';
import { ClientPortfolioDao } from '../domain/client-portfolio.dao.js';
import { ClientPortfolio } from '../domain/client-portfolio.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

@Injectable()
export class ListClientPortfoliosUseCase {
  constructor(
    private readonly clientDao: ClientDao,
    private readonly clientPortfolioDao: ClientPortfolioDao,
  ) {}

  async execute(clientId: number): Promise<ClientPortfolio[]> {
    const client = await this.clientDao.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }
    return this.clientPortfolioDao.findByClientId(clientId);
  }
}
