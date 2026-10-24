import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { PortfolioOrmEntity } from '../../catalogs/infrastructure/portfolio.orm-entity.js';

@Entity('client_portfolios')
@Unique('UQ_client_portfolios_client_portfolio', ['clientId', 'portfolioId'])
export class ClientPortfolioOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'client_id', type: 'int' })
  clientId!: number;

  @Column({ name: 'portfolio_id', type: 'int' })
  portfolioId!: number;

  @ManyToOne('PortfolioOrmEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio?: PortfolioOrmEntity;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
  registeredAt!: Date;
}
