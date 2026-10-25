import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  Matches,
} from 'class-validator';

/** Filters of the visits map (HU-36). */
export class VisitMapQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-19',
    description:
      "Day of operation ('YYYY-MM-DD', America/Bogota). Defaults to today.",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must use the 'YYYY-MM-DD' format",
  })
  @IsISO8601({ strict: true }, { message: 'date must be a valid date' })
  date?: string;

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
}
