import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersConversionController } from './orders-conversion.controller.js';
import { ConvertQuoteToOrderUseCase } from '../application/convert-quote-to-order.use-case.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';

describe('OrdersConversionController (Presentation - Quotes Endpoint)', () => {
  let controller: OrdersConversionController;
  let convertQuoteToOrderUseCase: Partial<ConvertQuoteToOrderUseCase>;
  let currentAdvisor: Partial<CurrentAdvisorProvider>;

  const mockOrder = new Order({
    id: 1,
    orderNumber: 'PED-0001',
    quoteId: 10,
    clientId: 5,
    status: OrderStatus.CREATED,
    subtotal: 500,
    total: 500,
    items: [],
  });

  beforeEach(() => {
    convertQuoteToOrderUseCase = {
      execute: vi.fn().mockResolvedValue(mockOrder),
    };

    currentAdvisor = {
      extract: vi.fn().mockResolvedValue(15),
    };

    controller = new OrdersConversionController(
      convertQuoteToOrderUseCase as ConvertQuoteToOrderUseCase,
      currentAdvisor as CurrentAdvisorProvider,
    );
  });

  it('converts approved quote to order via POST /quotes/:id/convert-to-order', async () => {
    const req = { headers: {} } as any;
    const response = await controller.convertToOrder(10, req);

    expect(convertQuoteToOrderUseCase.execute).toHaveBeenCalledWith({
      quoteId: 10,
      actorId: 15,
    });
    expect(response.orderNumber).toBe('PED-0001');
  });

  it('rejects the request when there is no authenticated session', async () => {
    vi.mocked(currentAdvisor.extract!).mockRejectedValue(
      new UnauthorizedException(),
    );

    await expect(
      controller.convertToOrder(10, {} as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(convertQuoteToOrderUseCase.execute).not.toHaveBeenCalled();
  });

  it('translates QuoteNotFoundError to NotFoundException', async () => {
    vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(
      new QuoteNotFoundError(999),
    );
    const req = { headers: {} } as any;

    await expect(controller.convertToOrder(999, req)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('translates QuoteNotApprovedForOrderError to BadRequestException', async () => {
    vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(
      new QuoteNotApprovedForOrderError('COT-0001', 'DRAFT'),
    );
    const req = { headers: {} } as any;

    await expect(controller.convertToOrder(10, req)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('translates QuoteAlreadyConvertedError to BadRequestException', async () => {
    vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(
      new QuoteAlreadyConvertedError(10, 'PED-0001'),
    );
    const req = { headers: {} } as any;

    await expect(controller.convertToOrder(10, req)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rethrows unexpected errors', async () => {
    const err = new Error('unexpected');
    vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(err);
    const req = { headers: {} } as any;

    await expect(controller.convertToOrder(10, req)).rejects.toThrow(err);
  });
});
