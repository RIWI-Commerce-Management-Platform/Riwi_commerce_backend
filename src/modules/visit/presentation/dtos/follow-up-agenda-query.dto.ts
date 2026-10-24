import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsIn, IsOptional, Matches } from 'class-validator';

import { FollowUpStatus } from '../../domain/follow-up.entity.js';

export class FollowUpAgendaQueryDto {
  @ApiPropertyOptional({
    description: 'A single day or a full week (Monday to Sunday).',
    enum: ['day', 'week'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'week'])
  period?: 'day' | 'week' = 'day';

  @ApiPropertyOptional({
    description: "Reference date in 'YYYY-MM-DD' format. Defaults to today.",
    example: '2026-10-20',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must use the 'YYYY-MM-DD' format.",
  })
  date?: string;

  @ApiPropertyOptional({ enum: FollowUpStatus })
  @IsOptional()
  @IsEnum(FollowUpStatus)
  status?: FollowUpStatus;
}
