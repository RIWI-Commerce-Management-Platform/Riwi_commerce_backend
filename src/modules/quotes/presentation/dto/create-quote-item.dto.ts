import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteItemDto {
  @ApiProperty({
    description: 'Name or description of the product',
    example: 'Laptop Dell Latitude 3420',
  })
  productName!: string;

  @ApiProperty({
    description: 'Quantity of product units',
    example: 3,
    minimum: 1,
  })
  quantity!: number;

  @ApiProperty({
    description: 'Unit price of the product',
    example: 750.5,
    minimum: 0,
  })
  unitPrice!: number;
}
