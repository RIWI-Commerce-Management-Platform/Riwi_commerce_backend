import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFollowUpDto {
  @ApiProperty({
    description: 'Date (and optional time) of the next contact, ISO 8601.',
    example: '2026-10-30T10:00:00-05:00',
  })
  @IsISO8601()
  dueDate: string;

  @ApiProperty({
    description: 'Activity to do (maximum 150 characters).',
    example: 'Call to confirm the order',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  activity: string;

  @ApiPropertyOptional({
    description: 'Observation (maximum 500 characters).',
    example: 'Send the updated price list before the call.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;

  @ApiPropertyOptional({
    description:
      'User responsible for the follow-up. Defaults to the current advisor.',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  responsibleId?: number;
}
