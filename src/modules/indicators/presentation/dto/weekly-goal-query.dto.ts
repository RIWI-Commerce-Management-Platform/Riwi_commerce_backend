import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class WeeklyGoalQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-21',
    description:
      "Any day of the week to show ('YYYY-MM-DD'). Defaults to today.",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must use the 'YYYY-MM-DD' format",
  })
  date?: string;
}
