import { ClientPortfolio } from './client-portfolio.entity.js';

export interface PortfolioSummary {
  id: number;
  name: string;
  isActive: boolean;
}

export abstract class ClientPortfolioDao {
  abstract findByClientId(clientId: number): Promise<ClientPortfolio[]>;
  abstract findOne(
    clientId: number,
    portfolioId: number,
  ): Promise<ClientPortfolio | null>;
  abstract save(clientPortfolio: ClientPortfolio): Promise<ClientPortfolio>;
  abstract delete(clientId: number, portfolioId: number): Promise<void>;
  abstract findPortfolio(portfolioId: number): Promise<PortfolioSummary | null>;
}
