import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogItemDto {
  @ApiProperty({
    example: 'Distribuidor Regional',
    description: 'Name of the catalog item',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Priority or display order (applicable to potentials)',
  })
  order?: number;

  @ApiPropertyOptional({
    example: 'Línea de productos masivos y aseo',
    description: 'Description (applicable to portfolios)',
  })
  description?: string;
}
