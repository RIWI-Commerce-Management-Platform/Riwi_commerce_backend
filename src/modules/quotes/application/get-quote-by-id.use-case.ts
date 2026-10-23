import { Injectable } from '@nestjs/common';
import { Quote } from '../domain/quote.entity.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { FileStorageService } from '../../../shared/file-storage/domain/file-storage.service.js';

export interface GetQuoteByIdResult {
  quote: Quote;
  documentUrl?: string | null;
}

@Injectable()
export class GetQuoteByIdUseCase {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    id: number,
    scope?: { advisorId?: number; clientId?: number },
  ): Promise<GetQuoteByIdResult> {
    const quote = scope?.advisorId
      ? await this.quoteRepository.findByIdAndAdvisor(id, scope.advisorId)
      : scope?.clientId
        ? await this.quoteRepository.findByIdAndClient(id, scope.clientId)
        : await this.quoteRepository.findById(id);
    if (!quote) {
      throw new QuoteNotFoundError(id);
    }

    let documentUrl: string | null = null;
    if (quote.documentKey) {
      documentUrl = await this.fileStorageService.getPresignedUrl(
        quote.documentKey,
      );
    }

    return {
      quote,
      documentUrl,
    };
  }
}
