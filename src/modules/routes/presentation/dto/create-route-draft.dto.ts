import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';

/**
 * Body to create a route draft (wizard step 1, HU-17).
 */
export class CreateRouteDraftDto {
  @ApiProperty({
    description: 'Descriptive name of the route',
    example: 'Barranquilla North weekly route',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Description or commercial goal of the route',
    example: 'Coverage of wholesale clients in the north sector',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Id of the zone the route belongs to',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  zoneId!: number;

  @ApiProperty({
    description: 'Day of the week the route runs on',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({
    description: 'How often the route repeats',
    enum: RouteFrequency,
    example: RouteFrequency.WEEKLY,
  })
  @IsEnum(RouteFrequency)
  frequency!: RouteFrequency;

  @ApiPropertyOptional({
    description: 'Suggested start time of the working day',
    example: '08:00:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Suggested end time of the working day',
    example: '17:00:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    description: 'Date the route starts running (YYYY-MM-DD)',
    example: '2026-10-26',
  })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    description: 'Date the route stops running (optional, YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
