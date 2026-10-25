import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { VisitStatus } from '../../../visit/domain/visit.entity.js';
import type { SortOrder } from '../../domain/tracking-visit.js';

/** Filters of the route and visit tracking table (HU-37). */
export class TrackingVisitsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-19',
    description:
      "Any day of the week to show ('YYYY-MM-DD'); the week runs from its Monday (America/Bogota). Defaults to the current week.",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "weekStart must use the 'YYYY-MM-DD' format",
  })
  @IsISO8601({ strict: true }, { message: 'weekStart must be a valid date' })
  weekStart?: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      "Territory (the client's zone). Forced to their own zone for regional directors.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  territoryId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Advisor (user id)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  advisorId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Route id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  routeId?: number;

  @ApiPropertyOptional({ enum: VisitStatus, description: 'Visit status' })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'asc',
    description: 'Order by scheduled date',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: SortOrder;
}
