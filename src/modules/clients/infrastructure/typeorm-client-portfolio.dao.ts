import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientPortfolio } from '../domain/client-portfolio.entity.js';
import {
  ClientPortfolioDao,
  PortfolioSummary,
} from '../domain/client-portfolio.dao.js';
import { ClientPortfolioOrmEntity } from './client-portfolio.orm-entity.js';
import { PortfolioOrmEntity } from '../../catalogs/infrastructure/portfolio.orm-entity.js';

@Injectable()
export class TypeOrmClientPortfolioDao implements ClientPortfolioDao {
  constructor(
    @InjectRepository(ClientPortfolioOrmEntity)
    private readonly repository: Repository<ClientPortfolioOrmEntity>,
    @InjectRepository(PortfolioOrmEntity)
    private readonly portfolioRepository: Repository<PortfolioOrmEntity>,
  ) {}

  async findByClientId(clientId: number): Promise<ClientPortfolio[]> {
    const rows = await this.repository.find({
      where: { clientId },
      relations: { portfolio: true },
      order: { registeredAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findOne(
    clientId: number,
    portfolioId: number,
  ): Promise<ClientPortfolio | null> {
    const row = await this.repository.findOne({
      where: { clientId, portfolioId },
      relations: { portfolio: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(clientPortfolio: ClientPortfolio): Promise<ClientPortfolio> {
    const saved = await this.repository.save(
      this.repository.create({
        id: clientPortfolio.id,
        clientId: clientPortfolio.clientId,
        portfolioId: clientPortfolio.portfolioId,
        registeredAt: clientPortfolio.registeredAt,
      }),
    );
    return new ClientPortfolio({
      id: saved.id,
      clientId: saved.clientId,
      portfolioId: saved.portfolioId,
      portfolioName: clientPortfolio.portfolioName,
      registeredAt: saved.registeredAt,
    });
  }

  async delete(clientId: number, portfolioId: number): Promise<void> {
    await this.repository.delete({ clientId, portfolioId });
  }

  async findPortfolio(portfolioId: number): Promise<PortfolioSummary | null> {
    const portfolio = await this.portfolioRepository.findOneBy({
      id: portfolioId,
    });
    return portfolio
      ? { id: portfolio.id, name: portfolio.name, isActive: portfolio.isActive }
      : null;
  }

  private toDomain(row: ClientPortfolioOrmEntity): ClientPortfolio {
    return new ClientPortfolio({
      id: row.id,
      clientId: row.clientId,
      portfolioId: row.portfolioId,
      portfolioName: row.portfolio?.name ?? null,
      registeredAt: row.registeredAt,
    });
  }
}
