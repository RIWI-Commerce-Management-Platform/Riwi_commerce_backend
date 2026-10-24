import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuoteItemDto } from './create-quote-item.dto.js';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'ID of the client associated with this quote',
    example: 1,
  })
  @IsInt()
  clientId!: number;

  @ApiPropertyOptional({
    description: 'Optional commercial notes or observations',
    example: 'Estimated delivery 5 business days after confirmation',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'S3 document storage key if file was uploaded',
    example: 'quotes/1730000000-quote-support.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  documentKey?: string;

  @ApiPropertyOptional({
    description:
      'Visit that generated this quote, when it is created from the visit form (HU-27)',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  visitId?: number;

  @ApiProperty({
    description: 'List of product items in the quote',
    type: [CreateQuoteItemDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}
