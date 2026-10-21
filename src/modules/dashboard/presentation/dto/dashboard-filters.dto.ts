
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFiltersDto {
  @ApiProperty({
    example: '2026-10-19',
    description: 'Monday of the requested week (YYYY-MM-DD)',
  })
  weekStart!: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Territory identifier',
  })
  territoryId?: string;
}
