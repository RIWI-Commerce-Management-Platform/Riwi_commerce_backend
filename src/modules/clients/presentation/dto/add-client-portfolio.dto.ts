import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddClientPortfolioDto {
  @ApiProperty({ example: 1, description: 'Portfolio catalog id (active)' })
  @IsInt()
  @Min(1)
  portfolioId!: number;
}
