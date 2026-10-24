import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mayorista' })
  name: string;

  @ApiPropertyOptional({ example: 1 })
  order?: number;

  @ApiPropertyOptional({ example: 'Non-perishable food line' })
  description?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  updatedAt: Date;

  constructor(item: any) {
    this.id = item.id;
    this.name = item.name;
    this.isActive = item.isActive;
    this.createdAt = item.createdAt;
    this.updatedAt = item.updatedAt;
    if (item.order !== undefined) this.order = item.order;
    if (item.description !== undefined) this.description = item.description;
  }
}
