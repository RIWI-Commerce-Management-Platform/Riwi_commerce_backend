import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientPortfolio } from '../../domain/client-portfolio.entity.js';

export class ClientPortfolioResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ example: 2 })
  portfolioId: number;

  @ApiPropertyOptional({ example: 'Beverages and snacks', nullable: true })
  portfolioName: string | null;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  registeredAt: Date;

  constructor(clientPortfolio: ClientPortfolio) {
    this.id = clientPortfolio.id!;
    this.clientId = clientPortfolio.clientId;
    this.portfolioId = clientPortfolio.portfolioId;
    this.portfolioName = clientPortfolio.portfolioName;
    this.registeredAt = clientPortfolio.registeredAt;
  }
}
