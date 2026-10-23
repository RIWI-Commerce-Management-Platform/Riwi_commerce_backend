import { Quote } from './quote.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export interface ListQuotesFilter {
  clientId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Port that the application layer depends on.
 * Concrete TypeORM implementation is provided in infrastructure layer.
 */
export abstract class QuoteRepository {
  abstract save(quote: Quote): Promise<Quote>;
  abstract findById(id: number): Promise<Quote | null>;
  abstract findByQuoteNumber(quoteNumber: string): Promise<Quote | null>;
  abstract generateNextQuoteNumber(): Promise<string>;
  abstract findPaginated(filter: ListQuotesFilter): Promise<PaginatedResult<Quote>>;
}
