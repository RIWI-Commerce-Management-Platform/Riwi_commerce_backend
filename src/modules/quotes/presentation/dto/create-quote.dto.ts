import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQuoteItemDto } from './create-quote-item.dto.js';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'ID of the client associated with this quote',
    example: 1,
  })
  clientId!: number;

  @ApiPropertyOptional({
    description: 'Optional commercial notes or observations',
    example: 'Entrega estimada en 5 dias habiles tras confirmacion',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'S3 document storage key if file was uploaded',
    example: 'quotes/1730000000-cotizacion-soporte.pdf',
  })
  documentKey?: string;

  @ApiProperty({
    description: 'List of product items in the quote',
    type: [CreateQuoteItemDto],
  })
  items!: CreateQuoteItemDto[];
}
