import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkVisitNotVisitedDto {
  @ApiPropertyOptional({
    description: 'Why the visit did not happen (maximum 500 characters).',
    example: 'The store was closed.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
