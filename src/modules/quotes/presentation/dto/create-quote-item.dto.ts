import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateQuoteItemDto {
  @ApiProperty({
    description: 'Name or description of the product',
    example: 'Laptop Dell Latitude 3420',
  })
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @ApiProperty({
    description: 'Quantity of product units',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
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
