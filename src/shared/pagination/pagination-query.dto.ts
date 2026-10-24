import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (minimum 1, default 1)',
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  page?: number | string;

  @ApiPropertyOptional({
    description:
      'Number of items per page (minimum 1, maximum 100, default 10)',
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  limit?: number | string;

  get parsedPage(): number {
    const parsed = Number(this.page);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  }

  get parsedLimit(): number {
    const parsed = Number(this.limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return 10;
    }
    return Math.min(parsed, 100);
  }
}
