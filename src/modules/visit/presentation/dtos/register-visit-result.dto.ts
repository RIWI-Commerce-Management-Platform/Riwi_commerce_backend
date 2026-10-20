import {
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class VisitResultDto {
  @IsString()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MaxLength(500)
  observation?: string;
}

export class RegisterVisitResultDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  endTime: string;

  @IsString()
  @MaxLength(500)
  observations: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VisitResultDto)
  results: VisitResultDto[];
}
