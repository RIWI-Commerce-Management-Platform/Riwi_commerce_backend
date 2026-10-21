import { ApiProperty } from '@nestjs/swagger';

import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class VisitResultDto {
  @ApiProperty({
    description: 'Visit result catalog id (must exist and be active).',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Optional observation for this specific result.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}

export class RegisterVisitResultDto {
  @ApiProperty({
    description: 'Visit end time in HH:mm or HH:mm:ss format.',
    example: '16:30:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  endTime: string;

  @ApiProperty({
    description: 'General visit observations (maximum 500 characters).',
    example: 'Cliente interesado en renovar el contrato anual.',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  observations: string;

  @ApiProperty({
    description: 'One or more selected visit results (validated against the catalog).',
    type: [VisitResultDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VisitResultDto)
  results: VisitResultDto[];
}
