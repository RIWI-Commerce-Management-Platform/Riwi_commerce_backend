import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Mayorista' })
  name: string;

  @ApiPropertyOptional({ example: 1 })
  order?: number;

  @ApiPropertyOptional({ example: 'Línea de alimentos no perecederos' })
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
