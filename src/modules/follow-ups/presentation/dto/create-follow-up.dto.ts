import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateFollowUpDto {
  @ApiProperty({
    description: 'Next follow-up date in YYYY-MM-DD format.',
    example: '2026-10-25',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  nextDate: string;

  @ApiProperty({
    description: 'Planned activity to be carried out.',
    example: 'Confirmar la reunión con el cliente',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  activity: string;

  @ApiPropertyOptional({
    description: 'Optional observation or note.',
    example: 'El cliente pidió información de precio antes del viernes.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}
