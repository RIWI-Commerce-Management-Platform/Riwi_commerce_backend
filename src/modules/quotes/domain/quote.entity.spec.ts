import { describe, expect, it } from 'vitest';
import { Quote } from './quote.entity.js';
import { QuoteStatus } from './quote-status.enum.js';
import { InvalidQuoteStatusTransitionError } from './errors/invalid-quote-status-transition.error.js';

describe('Quote entity (Domain)', () => {
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

  describe('changeStatus transitions', () => {
    it('allows DRAFT -> SENT', () => {
      const quote = createBaseQuote(QuoteStatus.DRAFT);
      quote.changeStatus(QuoteStatus.SENT);
      expect(quote.status).toBe(QuoteStatus.SENT);
    });

    it('allows DRAFT -> REJECTED', () => {
      const quote = createBaseQuote(QuoteStatus.DRAFT);
      quote.changeStatus(QuoteStatus.REJECTED);
      expect(quote.status).toBe(QuoteStatus.REJECTED);
    });

    it('allows SENT -> APPROVED', () => {
      const quote = createBaseQuote(QuoteStatus.SENT);
      quote.changeStatus(QuoteStatus.APPROVED);
      expect(quote.status).toBe(QuoteStatus.APPROVED);
    });

    it('allows SENT -> REJECTED', () => {
      const quote = createBaseQuote(QuoteStatus.SENT);
      quote.changeStatus(QuoteStatus.REJECTED);
      expect(quote.status).toBe(QuoteStatus.REJECTED);
    });

    it('does nothing when transitioning to the same status', () => {
      const quote = createBaseQuote(QuoteStatus.DRAFT);
      quote.changeStatus(QuoteStatus.DRAFT);
      expect(quote.status).toBe(QuoteStatus.DRAFT);
    });

    it('throws InvalidQuoteStatusTransitionError when transitioning from APPROVED', () => {
      const quote = createBaseQuote(QuoteStatus.APPROVED);
      expect(() => quote.changeStatus(QuoteStatus.DRAFT)).toThrow(
        InvalidQuoteStatusTransitionError,
      );
    });

    it('throws InvalidQuoteStatusTransitionError when transitioning from REJECTED', () => {
      const quote = createBaseQuote(QuoteStatus.REJECTED);
      expect(() => quote.changeStatus(QuoteStatus.APPROVED)).toThrow(
        InvalidQuoteStatusTransitionError,
      );
    });

    it('throws InvalidQuoteStatusTransitionError when transitioning DRAFT -> APPROVED directly', () => {
      const quote = createBaseQuote(QuoteStatus.DRAFT);
      expect(() => quote.changeStatus(QuoteStatus.APPROVED)).toThrow(
        InvalidQuoteStatusTransitionError,
      );
    });
  });
});
