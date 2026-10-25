import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class RescheduleVisitDto {
  @ApiProperty({
    description:
      'New date and time of the visit (ISO 8601). It must be in the future.',
    example: '2026-10-28T09:30:00-05:00',
  })
  @IsISO8601()
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'Why the visit was rescheduled (maximum 500 characters).',
    example: 'The purchasing manager asked to move the meeting.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
