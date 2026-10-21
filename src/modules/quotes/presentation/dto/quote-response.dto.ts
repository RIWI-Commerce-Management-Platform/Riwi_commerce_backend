import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Quote } from '../../domain/quote.entity.js';
import { QuoteStatus } from '../../domain/quote-status.enum.js';
import { QuoteItemResponseDto } from './quote-item-response.dto.js';

export class QuoteResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the quote',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Consecutive commercial number',
    example: 'COT-0001',
  })
  quoteNumber: string;

  @ApiProperty({
    description: 'ID of the client associated with the quote',
    example: 1,
  })
  clientId: number;

  @ApiProperty({
    description: 'Current status of the quote',
    enum: QuoteStatus,
    example: QuoteStatus.DRAFT,
  })
  status: QuoteStatus;

  @ApiProperty({
    description: 'Calculated subtotal of all items',
    example: 2251.5,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Calculated final total of the quote',
    example: 2251.5,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Commercial notes or observations',
    example: 'Entrega estimada en 5 dias habiles tras confirmacion',
  })
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'S3 document storage key reference',
    example: 'quotes/1730000000-cotizacion-soporte.pdf',
  })
  documentKey?: string | null;

  @ApiProperty({
    description: 'List of product items in the quote',
    type: [QuoteItemResponseDto],
  })
  items: QuoteItemResponseDto[];

  @ApiProperty({
    description: 'Timestamp when quote was created',
    example: '2026-10-20T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when quote was last updated',
    example: '2026-10-20T12:00:00.000Z',
  })
  updatedAt: Date;

  constructor(quote: Quote) {
    this.id = quote.id!;
    this.quoteNumber = quote.quoteNumber;
    this.clientId = quote.clientId;
    this.status = quote.status;
    this.subtotal = quote.subtotal;
    this.total = quote.total;
    this.notes = quote.notes;
    this.documentKey = quote.documentKey;
    this.items = (quote.items ?? []).map(
      (item) => new QuoteItemResponseDto(item),
    );
    this.createdAt = quote.createdAt;
    this.updatedAt = quote.updatedAt;
  }
}
