import { describe, expect, it } from 'vitest';
import { Quote } from './quote.entity.js';
import { QuoteStatus } from './quote-status.enum.js';

describe('Quote entity (Domain - HU-31)', () => {
  const createBaseQuote = (status: QuoteStatus = QuoteStatus.DRAFT) =>
    new Quote({
      id: 1,
      quoteNumber: 'COT-0001',
      clientId: 10,
      status,
      subtotal: 100,
      total: 100,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  it('attaches a document key and updates updatedAt', () => {
    const quote = createBaseQuote();
    expect(quote.documentKey).toBeUndefined();

    quote.attachDocument('quotes/soporte.pdf');

    expect(quote.documentKey).toBe('quotes/soporte.pdf');
    expect(quote.updatedAt).toBeInstanceOf(Date);
  });
});
