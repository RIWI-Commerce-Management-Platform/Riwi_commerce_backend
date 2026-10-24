import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({
    example: 'Distribuidor Regional',
    description: 'Name of the catalog item',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Priority or display order (applicable to potentials)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    example: 'Línea de productos masivos y aseo',
    description: 'Description (applicable to portfolios)',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
