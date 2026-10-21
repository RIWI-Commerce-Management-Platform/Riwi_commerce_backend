import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCatalogItemDto {
  @ApiPropertyOptional({
    example: 'Distribuidor Mayorista Actualizado',
    description: 'Updated name of the catalog item',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated priority or display order',
  })
  order?: number;

  @ApiPropertyOptional({
    example: 'Descripción actualizada de la línea de producto',
    description: 'Updated description',
  })
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status of the catalog item',
  })
  isActive?: boolean;
}
