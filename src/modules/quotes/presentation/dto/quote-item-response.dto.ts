import { ApiProperty } from '@nestjs/swagger';
import { QuoteItem } from '../../domain/quote-item.entity.js';

export class QuoteItemResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the quote item',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Product name or service description',
    example: 'Laptop Dell Latitude 3420',
  })
  productName: string;

  @ApiProperty({
    description: 'Quantity of items',
    example: 3,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 750.5,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Calculated subtotal for this item (quantity * unitPrice)',
    example: 2251.5,
  })
  subtotal: number;

  constructor(item: QuoteItem) {
    this.id = item.id!;
    this.productName = item.productName;
    this.quantity = item.quantity;
    this.unitPrice = item.unitPrice;
    this.subtotal = item.subtotal;
  }
}
