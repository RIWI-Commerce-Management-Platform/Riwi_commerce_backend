import { Injectable } from '@nestjs/common';
import {
  QuoteRepository,
  ListQuotesFilter,
} from '../domain/quote.repository.js';
import { Quote } from '../domain/quote.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

@Injectable()
export class ListQuotesUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) {}

  async execute(filter: ListQuotesFilter): Promise<PaginatedResult<Quote>> {
    return this.quoteRepository.findPaginated(filter);
  }
}
