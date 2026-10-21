import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateQuoteUseCase } from './create-quote.use-case.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { EmptyQuoteItemsError } from '../domain/errors/empty-quote-items.error.js';
import { InvalidQuoteItemValuesError } from '../domain/errors/invalid-quote-item-values.error.js';
import { Quote } from '../domain/quote.entity.js';

describe('CreateQuoteUseCase', () => {
  let useCase: CreateQuoteUseCase;
  let mockQuoteRepository: Partial<QuoteRepository>;

  beforeEach(() => {
    mockQuoteRepository = {
      generateNextQuoteNumber: vi.fn().mockResolvedValue('COT-0001'),
      save: vi.fn().mockImplementation((quote: Quote) => Promise.resolve(quote)),
    };

    useCase = new CreateQuoteUseCase(
      mockQuoteRepository as QuoteRepository,
    );
  });

  it('should throw EmptyQuoteItemsError when items array is empty', async () => {
    await expect(
      useCase.execute({
        clientId: 123,
        items: [],
      }),
    ).rejects.toThrow(EmptyQuoteItemsError);
  });

  it('should throw InvalidQuoteItemValuesError when quantity is 0 or negative', async () => {
    await expect(
      useCase.execute({
        clientId: 123,
        items: [
          {
            productName: 'Monitor 27"',
            quantity: 0,
            unitPrice: 200,
          },
        ],
      }),
    ).rejects.toThrow(InvalidQuoteItemValuesError);
  });

  it('should throw InvalidQuoteItemValuesError when unit price is negative', async () => {
    await expect(
      useCase.execute({
        clientId: 123,
        items: [
          {
            productName: 'Teclado Mecanico',
            quantity: 1,
            unitPrice: -10,
          },
        ],
      }),
    ).rejects.toThrow(InvalidQuoteItemValuesError);
  });

  it('should successfully calculate subtotal and total in backend and create quote', async () => {
    const result = await useCase.execute({
      clientId: 123,
      notes: 'Descuento aplicado',
      items: [
        {
          productName: 'Laptop Dell Latitude',
          quantity: 2,
          unitPrice: 500,
        },
        {
          productName: 'Mouse Inalámbrico',
          quantity: 3,
          unitPrice: 25.5,
        },
      ],
    });

    expect(result.quoteNumber).toBe('COT-0001');
    expect(result.status).toBe(QuoteStatus.DRAFT);
    expect(result.clientId).toBe(123);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].subtotal).toBe(1000);
    expect(result.items[1].subtotal).toBe(76.5);
    expect(result.subtotal).toBe(1076.5);
    expect(result.total).toBe(1076.5);
    expect(mockQuoteRepository.save).toHaveBeenCalledTimes(1);
  });
});
