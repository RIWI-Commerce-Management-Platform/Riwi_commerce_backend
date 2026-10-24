import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';

/**
 * Body to update the general data of a route (HU-17, HU-21).
 */
export class UpdateRouteDraftDto {
  @ApiPropertyOptional({
    description: 'Descriptive name of the route',
    example: 'Barranquilla North weekly route - adjusted',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description or commercial goal of the route',
    example: 'More retail clients in the north sector',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Id of the zone the route belongs to',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Day of the week the route runs on',
    enum: DayOfWeek,
    example: DayOfWeek.TUESDAY,
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({
    description: 'How often the route repeats',
    enum: RouteFrequency,
    example: RouteFrequency.BIWEEKLY,
  })
  @IsOptional()
  @IsEnum(RouteFrequency)
  frequency?: RouteFrequency;

  @ApiPropertyOptional({
    description: 'Suggested start time of the working day',
    example: '08:30:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Suggested end time of the working day',
    example: '17:30:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Date the route starts running (YYYY-MM-DD)',
    example: '2026-10-26',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date the route stops running (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
