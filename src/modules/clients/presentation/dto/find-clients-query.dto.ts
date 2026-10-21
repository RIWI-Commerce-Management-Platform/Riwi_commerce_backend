import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';

export class FindClientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Partial case-insensitive search over NIT, business name, or commercial name',
    example: 'Andes',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Zone UUID',
    example: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb',
  })
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Client Type UUID',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  clientTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Potential classification UUID',
    example: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
  })
  potentialId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Municipality or City',
    example: 'Medellín',
  })
  municipality?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status (true or false)',
    example: true,
    type: Boolean,
  })
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
}

