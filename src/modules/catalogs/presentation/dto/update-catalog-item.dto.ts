import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCatalogItemDto {
  @ApiPropertyOptional({
    example: 'Updated wholesale distributor',
    description: 'Updated name of the catalog item',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated priority or display order',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    example: 'Updated description of the product line',
    description: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status of the catalog item',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
