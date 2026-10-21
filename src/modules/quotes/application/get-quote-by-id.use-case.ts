import { Injectable } from '@nestjs/common';
import { Quote } from '../domain/quote.entity.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';

@Injectable()
export class GetQuoteByIdUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) {}

  async execute(id: number): Promise<Quote> {
    const quote = await this.quoteRepository.findById(id);
    if (!quote) {
      throw new QuoteNotFoundError(id);
    }
    return quote;
  }
}
