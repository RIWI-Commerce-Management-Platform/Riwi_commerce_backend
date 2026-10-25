import { Quote } from './quote.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import { ActorScope } from '../../../shared/auth/domain/current-actor.provider.js';

export interface ListQuotesFilter {
  clientId?: number;
  advisorId?: number;
  zoneId?: number;
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
export abstract class QuoteDao {
  abstract save(quote: Quote): Promise<Quote>;
  /** With a scope, a quote outside it is reported as not found (HU-06). */
  abstract findById(id: number, scope?: ActorScope): Promise<Quote | null>;
  abstract findByQuoteNumber(quoteNumber: string): Promise<Quote | null>;
  abstract generateNextQuoteNumber(): Promise<string>;
  abstract findPaginated(
    filter: ListQuotesFilter,
  ): Promise<PaginatedResult<Quote>>;
}
