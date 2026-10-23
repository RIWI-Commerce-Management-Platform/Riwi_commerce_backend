import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateQuoteItemDto {
  @ApiProperty({
    description: 'Name or description of the product',
    example: 'Laptop Dell Latitude 3420',
  })
  @IsString()
  @MaxLength(200)
  productName!: string;

  @ApiProperty({
    description: 'Quantity of product units',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Unit price of the product',
    example: 750.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
