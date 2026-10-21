
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFiltersDto {
  @ApiProperty({
    example: '2026-10-19',
    description: 'Monday of the requested week (YYYY-MM-DD)',
  })
  weekStart!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Territory identifier',
  })
  territoryId?: number | string;

  get parsedTerritoryId(): number | undefined {
    if (
      this.territoryId === undefined ||
      this.territoryId === null ||
      this.territoryId === ''
    ) {
      return undefined;
    }
    const parsed = Number(this.territoryId);
    return Number.isInteger(parsed) ? parsed : undefined;
  }
}
