import { Injectable } from '@nestjs/common';
import { Quote } from '../domain/quote.entity.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';

@Injectable()
export class GetQuoteByIdUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) {}

  async execute(
    id: number,
    scope?: { advisorId?: number; clientId?: number },
  ): Promise<Quote> {
    const quote = scope?.advisorId
      ? await this.quoteRepository.findByIdAndAdvisor(id, scope.advisorId)
      : scope?.clientId
        ? await this.quoteRepository.findByIdAndClient(id, scope.clientId)
        : await this.quoteRepository.findById(id);
    if (!quote) {
      throw new QuoteNotFoundError(id);
    }
    return quote;
  }
}
