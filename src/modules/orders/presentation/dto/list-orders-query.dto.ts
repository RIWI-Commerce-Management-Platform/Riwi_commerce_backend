import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { OrderStatus } from '../../domain/order-status.enum.js';

export class ListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter orders by customer ID',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Filter orders by order status',
    enum: OrderStatus,
    example: OrderStatus.CREATED,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter orders starting from date (YYYY-MM-DD)',
    example: '2026-10-01',
    type: String,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter orders up to date (YYYY-MM-DD)',
    example: '2026-10-31',
    type: String,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
