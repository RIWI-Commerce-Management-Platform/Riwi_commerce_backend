import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';

export class FindClientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Partial case-insensitive search over NIT, business name, or commercial name',
    example: 'Andes',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Zone ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  zoneId?: number | string;

  @ApiPropertyOptional({
    description: 'Filter by Client Type ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  clientTypeId?: number | string;

  @ApiPropertyOptional({
    description: 'Filter by Potential classification ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  potentialId?: number | string;

  @ApiPropertyOptional({
    description: 'Filter by Municipality or City',
    example: 'Medellín',
  })
  @IsOptional()
  municipality?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status (true or false)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  isActive?: boolean | string;

  get parsedIsActive(): boolean | undefined {
    if (
      this.isActive === undefined ||
      this.isActive === null ||
      this.isActive === ''
    ) {
      return undefined;
    }
    if (typeof this.isActive === 'boolean') {
      return this.isActive;
    }
    const lower = String(this.isActive).trim().toLowerCase();
    if (lower === 'true' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === '0') {
      return false;
    }
    return undefined;
  }

  get parsedZoneId(): number | undefined {
    return parseFilterId(this.zoneId);
  }

  get parsedClientTypeId(): number | undefined {
    return parseFilterId(this.clientTypeId);
  }

  get parsedPotentialId(): number | undefined {
    return parseFilterId(this.potentialId);
  }
}

function parseFilterId(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}
