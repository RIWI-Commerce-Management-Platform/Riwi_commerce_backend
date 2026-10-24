import { Injectable } from '@nestjs/common';
import { Quote } from '../domain/quote.entity.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { FileStorageService } from '../../../shared/file-storage/domain/file-storage.service.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

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

  async execute(id: number, actor?: CurrentActor): Promise<GetQuoteByIdResult> {
    const quote = await this.quoteRepository.findById(id, scopeForActor(actor));
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
