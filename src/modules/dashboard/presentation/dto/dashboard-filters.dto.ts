import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsPositive,
  Matches,
} from 'class-validator';

export class DashboardFiltersDto {
  @ApiPropertyOptional({
    example: '2026-10-19',
    description:
      "Any day of the week to show ('YYYY-MM-DD'); the week runs from its Monday. Defaults to the current week.",
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
      'Territory (zone). Every territory when omitted; forced to their own zone for regional directors.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  territoryId?: number;
}
