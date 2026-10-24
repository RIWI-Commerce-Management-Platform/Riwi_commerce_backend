import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { QuoteStatus } from '../../domain/quote-status.enum.js';

export class ListQuotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter quotes by customer ID',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @ApiPropertyOptional({
    description:
      'Filter quotes by advisor (user id). Ignored for advisors, who only see their own quotes.',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  advisorId?: number;

  @ApiPropertyOptional({
    description: 'Filter quotes by quote status',
    enum: QuoteStatus,
    example: QuoteStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({
    description: 'Filter quotes starting from date (YYYY-MM-DD)',
    example: '2026-10-01',
    type: String,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter quotes up to date (YYYY-MM-DD)',
    example: '2026-10-31',
    type: String,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
