import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

export class RescheduleVisitDto {
  @ApiProperty({
    description:
      'New scheduled date and time as an ISO 8601 timestamp with timezone.',
    example: '2026-10-22T14:30:00-05:00',
  })
  @IsDateString({ strict: true, strictSeparator: true })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/)
  scheduledAt: string;
}
