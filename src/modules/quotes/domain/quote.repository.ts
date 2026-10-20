import { Quote } from './quote.entity.js';

/**
 * Port that the application layer depends on.
 * Concrete TypeORM implementation is provided in infrastructure layer.
 */
export abstract class QuoteRepository {
  abstract save(quote: Quote): Promise<Quote>;
  abstract findById(id: string): Promise<Quote | null>;
  abstract findByQuoteNumber(quoteNumber: string): Promise<Quote | null>;
  abstract generateNextQuoteNumber(): Promise<string>;
}
