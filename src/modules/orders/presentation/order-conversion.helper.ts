import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { ConvertQuoteToOrderUseCase } from '../application/convert-quote-to-order.use-case.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';

export async function executeQuoteConversion(
  quoteId: number,
  request: Request,
  convertQuoteToOrderUseCase: ConvertQuoteToOrderUseCase,
  currentAdvisor: CurrentAdvisorProvider,
): Promise<OrderResponseDto> {
  const actorId =
    (await currentAdvisor.extract(request).catch(() => 1)) ?? undefined;

  try {
    const order = await convertQuoteToOrderUseCase.execute({
      quoteId,
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
