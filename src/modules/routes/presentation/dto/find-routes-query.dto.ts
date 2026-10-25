import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';
import { RouteStatus } from '../../domain/route-status.enum.js';

function parseBooleanQuery(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/**
 * Query filters for the paginated route list (HU-21).
 */
export class FindRoutesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by zone',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  zoneId?: number;

  @ApiPropertyOptional({
    description:
      'Filter by assigned advisor (ignored for advisors, who only see their own routes)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  advisorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by route status',
    enum: RouteStatus,
    example: RouteStatus.ASSIGNED,
  })
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @ApiPropertyOptional({
    description: 'Filter by day of the week',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({
    description: 'Filter by frequency',
    enum: RouteFrequency,
    example: RouteFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(RouteFrequency)
  frequency?: RouteFrequency;

  @ApiPropertyOptional({
    description: 'Filter by active or inactive',
    example: true,
  })
  @IsOptional()
  // @Type(() => Boolean) would turn the string "false" into true
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Text search on the route name',
    example: 'North',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
