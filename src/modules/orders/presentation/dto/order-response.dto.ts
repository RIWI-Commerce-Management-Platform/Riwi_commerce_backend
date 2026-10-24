import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../../domain/order.entity.js';
import { OrderStatus } from '../../domain/order-status.enum.js';
import { OrderItemResponseDto } from './order-item-response.dto.js';

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PED-0001' })
  orderNumber: string;

  @ApiProperty({ example: 10 })
  quoteId: number;

  @ApiProperty({ example: 5 })
  clientId: number;

  @ApiPropertyOptional({
    description: 'Advisor (user id) of the originating quote',
    example: 5,
    nullable: true,
  })
  advisorId: number | null;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CREATED })
  status: OrderStatus;

  @ApiProperty({ example: 300.0 })
  subtotal: number;

  @ApiProperty({ example: 300.0 })
  total: number;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(order: Order) {
    this.id = order.id!;
    this.orderNumber = order.orderNumber;
    this.quoteId = order.quoteId;
    this.clientId = order.clientId;
    this.advisorId = order.advisorId;
    this.status = order.status;
    this.subtotal = order.subtotal;
    this.total = order.total;
    this.items = (order.items ?? []).map(
      (item) => new OrderItemResponseDto(item),
    );
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}
