import { Injectable } from '@nestjs/common';
import {
  QuoteRepository,
  ListQuotesFilter,
} from '../domain/quote.repository.js';
import { Quote } from '../domain/quote.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

@Injectable()
export class ListQuotesUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) {}

  /** An advisor only sees their quotes and a director their zone (HU-06). */
  async execute(
    filter: ListQuotesFilter,
    actor?: CurrentActor,
  ): Promise<PaginatedResult<Quote>> {
    return this.quoteRepository.findPaginated({
      ...filter,
      ...scopeForActor(actor),
    });
  }
}
