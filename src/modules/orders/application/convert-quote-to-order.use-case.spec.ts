import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConvertQuoteToOrderUseCase } from './convert-quote-to-order.use-case.js';
import { OrderRepository } from '../domain/order.repository.js';
import { QuoteRepository } from '../../quotes/domain/quote.repository.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { Quote } from '../../quotes/domain/quote.entity.js';
import { QuoteItem } from '../../quotes/domain/quote-item.entity.js';
import { QuoteStatus } from '../../quotes/domain/quote-status.enum.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';

describe('ConvertQuoteToOrderUseCase (Application)', () => {
  let useCase: ConvertQuoteToOrderUseCase;
  let orderRepository: Partial<OrderRepository>;
  let quoteRepository: Partial<QuoteRepository>;
  let activityLogService: Partial<ActivityLogService>;

  const mockQuote = new Quote({
    id: 10,
    quoteNumber: 'COT-0001',
    clientId: 5,
    status: QuoteStatus.APPROVED,
    subtotal: 500,
    total: 500,
    items: [
      new QuoteItem({
        id: 1,
        quoteId: 10,
        productName: 'Printer',
        quantity: 1,
        unitPrice: 500,
        subtotal: 500,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    orderRepository = {
      findByQuoteId: vi.fn().mockResolvedValue(null),
      generateNextOrderNumber: vi.fn().mockResolvedValue('PED-0001'),
      save: vi.fn().mockImplementation(async (order: Order) => order),
    };

    quoteRepository = {
      findById: vi.fn().mockResolvedValue(mockQuote),
    };

    activityLogService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ConvertQuoteToOrderUseCase(
      orderRepository as OrderRepository,
      quoteRepository as QuoteRepository,
      activityLogService as ActivityLogService,
    );
  });

  it('successfully converts approved quote to order and records audit log', async () => {
    const result = await useCase.execute({ quoteId: 10, actorId: 7 });

    expect(result.orderNumber).toBe('PED-0001');
    expect(result.quoteId).toBe(10);
    expect(result.clientId).toBe(5);
    expect(result.status).toBe(OrderStatus.CREATED);
    expect(result.subtotal).toBe(500);
    expect(result.total).toBe(500);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('Printer');
    expect(orderRepository.save).toHaveBeenCalled();
    expect(activityLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.created',
        entityType: 'order',
        actorId: 7,
      }),
    );
  });

  it('defaults actorId to 1 when omitted', async () => {
    await useCase.execute({ quoteId: 10 });

    expect(activityLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 1,
      }),
    );
  });

  it('throws QuoteNotFoundError when quote does not exist', async () => {
    vi.mocked(quoteRepository.findById!).mockResolvedValue(null);

    await expect(useCase.execute({ quoteId: 999 })).rejects.toThrow(
      QuoteNotFoundError,
    );
  });

  it('throws QuoteNotApprovedForOrderError when quote is in DRAFT status', async () => {
    const draftQuote = new Quote({
      id: 11,
      quoteNumber: 'COT-0002',
      clientId: 5,
      status: QuoteStatus.DRAFT,
      subtotal: 100,
      total: 100,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(quoteRepository.findById!).mockResolvedValue(draftQuote);

    await expect(useCase.execute({ quoteId: 11 })).rejects.toThrow(
      QuoteNotApprovedForOrderError,
    );
  });

  it('throws QuoteAlreadyConvertedError when quote was previously converted', async () => {
    const existingOrder = new Order({
      id: 2,
      orderNumber: 'PED-0001',
      quoteId: 10,
      clientId: 5,
      subtotal: 500,
      total: 500,
      items: [],
    });
    vi.mocked(orderRepository.findByQuoteId!).mockResolvedValue(existingOrder);

    await expect(useCase.execute({ quoteId: 10 })).rejects.toThrow(
      QuoteAlreadyConvertedError,
    );
  });
});
