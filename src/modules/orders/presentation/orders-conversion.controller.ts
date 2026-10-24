import { Controller, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ConvertQuoteToOrderUseCase } from '../application/convert-quote-to-order.use-case.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { executeQuoteConversion } from './order-conversion.helper.js';

@ApiTags('Quotes')
@Controller('quotes')
export class OrdersConversionController {
  constructor(
    private readonly convertQuoteToOrderUseCase: ConvertQuoteToOrderUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
  ) {}

  @Post(':id/convert-to-order')
  @ApiOperation({
    summary: 'Convert an approved quote into an order (HU-33)',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully with consecutive PED-0001',
    type: OrderResponseDto,
  })
  async convertToOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<OrderResponseDto> {
    return executeQuoteConversion(
      id,
      request,
      this.convertQuoteToOrderUseCase,
      this.currentAdvisor,
    );
  }
}
