import { Quote } from './quote.entity.js';

/**
 * Port that the application layer depends on.
 * Concrete TypeORM implementation is provided in infrastructure layer.
 */
export abstract class QuoteRepository {
  abstract save(quote: Quote): Promise<Quote>;
  abstract findById(id: number): Promise<Quote | null>;
  abstract findByIdAndAdvisor(
    id: number,
    advisorId: number,
  ): Promise<Quote | null>;
  abstract findByIdAndClient(id: number, clientId: number): Promise<Quote | null>;
  abstract findByQuoteNumber(quoteNumber: string): Promise<Quote | null>;
  abstract generateNextQuoteNumber(): Promise<string>;
}
