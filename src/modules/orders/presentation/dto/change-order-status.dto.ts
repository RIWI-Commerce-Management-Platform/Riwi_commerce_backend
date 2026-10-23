import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../domain/order-status.enum.js';

export class ChangeOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'New status for the order',
    example: OrderStatus.DISPATCHED,
  })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
