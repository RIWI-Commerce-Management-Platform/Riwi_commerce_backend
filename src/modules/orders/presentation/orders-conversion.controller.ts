import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ConvertQuoteToOrderUseCase } from '../application/convert-quote-to-order.use-case.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';

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
    const actorId = await this.currentAdvisor.extract(request).catch(() => 1);

    try {
      const order = await this.convertQuoteToOrderUseCase.execute({
        quoteId: id,
        actorId,
      });
      return new OrderResponseDto(order);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof QuoteNotApprovedForOrderError ||
        error instanceof QuoteAlreadyConvertedError
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
