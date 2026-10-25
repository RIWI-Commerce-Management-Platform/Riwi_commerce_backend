import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsIn, IsOptional, Matches } from 'class-validator';

export class VisitAgendaQueryDto {
  @ApiPropertyOptional({
    description:
      'Agenda period: a single day or a full week (Monday to Sunday).',
    enum: ['day', 'week'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'week'])
  period?: 'day' | 'week' = 'day';

  @ApiPropertyOptional({
    description:
      "Reference date for the agenda in 'YYYY-MM-DD' format. Defaults to today.",
    example: '2026-10-20',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must use the 'YYYY-MM-DD' format.",
  })
  date?: string;
}
