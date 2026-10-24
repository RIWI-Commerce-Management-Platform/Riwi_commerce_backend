import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListQuotesUseCase } from './list-quotes.use-case.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';

describe('ListQuotesUseCase (Application - HU-34)', () => {
  let useCase: ListQuotesUseCase;
  let quoteRepository: Partial<QuoteRepository>;

  const mockQuote = new Quote({
    id: 1,
    quoteNumber: 'COT-0001',
    clientId: 5,
    status: QuoteStatus.DRAFT,
    subtotal: 100,
    total: 100,
    items: [],
  });

  beforeEach(() => {
    quoteRepository = {
      findPaginated: vi.fn().mockResolvedValue({
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
    };

    useCase = new ListQuotesUseCase(quoteRepository as QuoteRepository);
  });

  it('lists paginated quotes with applied filters', async () => {
    const filter = {
      clientId: 5,
      status: QuoteStatus.DRAFT,
      page: 1,
      limit: 10,
    };
    const result = await useCase.execute(filter);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].quoteNumber).toBe('COT-0001');
    expect(quoteRepository.findPaginated).toHaveBeenCalledWith(filter);
  });
});
