import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateQuoteUseCase } from './create-quote.use-case.js';
import { QuoteDao } from '../domain/quote.dao.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { EmptyQuoteItemsError } from '../domain/errors/empty-quote-items.error.js';
import { InvalidQuoteItemValuesError } from '../domain/errors/invalid-quote-item-values.error.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';
import { Quote } from '../domain/quote.entity.js';
import { ClientReader } from '../../../shared/clients/domain/client-reader.js';

describe('CreateQuoteUseCase', () => {
  let useCase: CreateQuoteUseCase;
  let mockQuoteDao: Partial<QuoteDao>;
  let mockClientReader: Partial<ClientReader>;

  beforeEach(() => {
    mockQuoteDao = {
      generateNextQuoteNumber: vi.fn().mockResolvedValue('COT-0001'),
      save: vi
        .fn()
        .mockImplementation((quote: Quote) => Promise.resolve(quote)),
    };
    mockClientReader = {
      findById: vi.fn().mockResolvedValue({
        id: 123,
        name: 'Client 123',
        contactName: null,
        potential: null,
      }),
    };

    useCase = new CreateQuoteUseCase(
      mockQuoteDao as QuoteDao,
      mockClientReader as ClientReader,
    );
  });

  it('should throw ClientNotFoundError when the client does not exist', async () => {
    (mockClientReader.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({
        clientId: 999,
        items: [{ productName: 'Monitor 27"', quantity: 1, unitPrice: 200 }],
      }),
    ).rejects.toThrow(ClientNotFoundError);
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
          productName: 'Wireless Mouse',
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
    expect(mockQuoteDao.save).toHaveBeenCalledTimes(1);
  });
});
