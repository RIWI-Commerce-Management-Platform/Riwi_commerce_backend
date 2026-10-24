import { Injectable } from '@nestjs/common';
import { QuoteRepository } from '../domain/quote.repository.js';
import { FileStorageService } from '../../../shared/file-storage/domain/file-storage.service.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { Quote } from '../domain/quote.entity.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

export interface AttachQuoteDocumentResult {
  quote: Quote;
  documentUrl: string;
}

export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class AttachQuoteDocumentUseCase {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    quoteId: number,
    file: UploadFileInput,
    actor?: CurrentActor,
  ): Promise<AttachQuoteDocumentResult> {
    const quote = await this.quoteRepository.findById(
      quoteId,
      scopeForActor(actor),
    );
    if (!quote) {
      throw new QuoteNotFoundError(quoteId);
    }

    const uploadResult = await this.fileStorageService.upload({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
      folder: 'quotes',
    });

    quote.attachDocument(uploadResult.key);
    const updatedQuote = await this.quoteRepository.save(quote);

    const documentUrl = await this.fileStorageService.getPresignedUrl(
      uploadResult.key,
    );

    return {
      quote: updatedQuote,
      documentUrl,
    };
  }
}
