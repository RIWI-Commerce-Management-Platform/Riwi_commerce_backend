import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Matches } from 'class-validator';

export class IndicatorsQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01',
    description:
      'From this day (inclusive). Defaults to the first day of the current month.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "from must use the 'YYYY-MM-DD' format",
  })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description:
      'Up to this day (inclusive). Defaults to the last day of the current month.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "to must use the 'YYYY-MM-DD' format",
  })
  to?: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Only this zone. Forced to their own zone for regional directors.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  zoneId?: number;
}
