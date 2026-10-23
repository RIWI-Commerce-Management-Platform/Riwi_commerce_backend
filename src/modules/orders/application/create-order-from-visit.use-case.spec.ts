import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { QuoteRepository } from '../../quotes/domain/quote.repository.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { Quote } from '../../quotes/domain/quote.entity.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { QuoteDoesNotBelongToVisitError } from '../domain/errors/quote-does-not-belong-to-visit.error.js';
import { ConvertQuoteToOrderUseCase } from './convert-quote-to-order.use-case.js';
import { CreateOrderFromVisitUseCase } from './create-order-from-visit.use-case.js';

describe('CreateOrderFromVisitUseCase', () => {
  let useCase: CreateOrderFromVisitUseCase;
  let visitDao: { findByIdAndAdvisor: ReturnType<typeof vi.fn> };
  let quoteRepository: { findById: ReturnType<typeof vi.fn> };
  let convertQuoteToOrder: { execute: ReturnType<typeof vi.fn> };

  const order = new Order({
    id: 3,
    orderNumber: 'PED-0003',
    quoteId: 8,
    clientId: 12,
    status: OrderStatus.CREATED,
    subtotal: 100,
    total: 100,
    items: [],
  });

  beforeEach(() => {
    visitDao = {
      findByIdAndAdvisor: vi.fn().mockResolvedValue({ clientId: 12 }),
    };
    quoteRepository = {
      findById: vi.fn().mockResolvedValue({ clientId: 12 } as Quote),
    };
    convertQuoteToOrder = {
      execute: vi.fn().mockResolvedValue(order),
    };
    useCase = new CreateOrderFromVisitUseCase(
      visitDao as unknown as VisitDao,
      quoteRepository as unknown as QuoteRepository,
      convertQuoteToOrder as unknown as ConvertQuoteToOrderUseCase,
    );
  });

  it('converts a quote belonging to the advisor-owned visit client', async () => {
    await expect(
      useCase.execute({ visitId: 41, advisorId: 7, quoteId: 8 }),
    ).resolves.toBe(order);

    expect(visitDao.findByIdAndAdvisor).toHaveBeenCalledWith(41, 7);
    expect(convertQuoteToOrder.execute).toHaveBeenCalledWith({
      quoteId: 8,
      actorId: 7,
    });
  });

  it('does not convert a quote from a different client', async () => {
    quoteRepository.findById.mockResolvedValue({ clientId: 99 } as Quote);

    await expect(
      useCase.execute({ visitId: 41, advisorId: 7, quoteId: 8 }),
    ).rejects.toThrow(QuoteDoesNotBelongToVisitError);
    expect(convertQuoteToOrder.execute).not.toHaveBeenCalled();
  });

  it('rejects visits not owned by the advisor', async () => {
    visitDao.findByIdAndAdvisor.mockResolvedValue(null);

    await expect(
      useCase.execute({ visitId: 41, advisorId: 7, quoteId: 8 }),
    ).rejects.toThrow(NotFoundException);
    expect(quoteRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects missing quotes', async () => {
    quoteRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ visitId: 41, advisorId: 7, quoteId: 8 }),
    ).rejects.toThrow(QuoteNotFoundError);
    expect(convertQuoteToOrder.execute).not.toHaveBeenCalled();
  });
});
