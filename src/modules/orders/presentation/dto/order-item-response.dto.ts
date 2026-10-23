import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from '../../domain/order-item.entity.js';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  orderId: number;

  @ApiProperty({ example: 'Industrial Pump X-500' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  unitPrice: number;

  @ApiProperty({ example: 300.0 })
  subtotal: number;

  constructor(item: OrderItem) {
    this.id = item.id!;
    this.orderId = item.orderId!;
    this.productName = item.productName;
    this.quantity = item.quantity;
    this.unitPrice = item.unitPrice;
    this.subtotal = item.subtotal;
  }
}
