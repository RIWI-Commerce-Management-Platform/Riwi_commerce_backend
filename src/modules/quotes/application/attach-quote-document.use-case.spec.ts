import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttachQuoteDocumentUseCase } from './attach-quote-document.use-case.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { FileStorageService } from '../../../shared/file-storage/domain/file-storage.service.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';

describe('AttachQuoteDocumentUseCase', () => {
  let useCase: AttachQuoteDocumentUseCase;
  let quoteRepository: Partial<QuoteRepository>;
  let fileStorageService: Partial<FileStorageService>;

  const mockQuote = new Quote({
    id: 1,
    quoteNumber: 'COT-0001',
    clientId: 10,
    status: QuoteStatus.DRAFT,
    subtotal: 500,
    total: 500,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    quoteRepository = {
      findById: vi.fn().mockResolvedValue(mockQuote),
      save: vi.fn().mockImplementation((q) => Promise.resolve(q)),
    };

    fileStorageService = {
      upload: vi.fn().mockResolvedValue({
        key: 'quotes/173000-soporte.pdf',
        originalName: 'soporte.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      }),
      getPresignedUrl: vi
        .fn()
        .mockResolvedValue(
          'https://s3.amazonaws.com/quotes/173000-soporte.pdf',
        ),
    };

    useCase = new AttachQuoteDocumentUseCase(
      quoteRepository as QuoteRepository,
      fileStorageService as FileStorageService,
    );
  });

  it('uploads file to S3, attaches key to quote, and returns presigned URL', async () => {
    const file = {
      buffer: Buffer.from('dummy pdf content'),
      originalname: 'soporte.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    };

    const result = await useCase.execute(1, file);

    expect(quoteRepository.findById).toHaveBeenCalledWith(1);
    expect(fileStorageService.upload).toHaveBeenCalledWith({
      buffer: file.buffer,
      filename: 'soporte.pdf',
      mimetype: 'application/pdf',
      folder: 'quotes',
    });
    expect(quoteRepository.save).toHaveBeenCalled();
    expect(fileStorageService.getPresignedUrl).toHaveBeenCalledWith(
      'quotes/173000-soporte.pdf',
    );
    expect(result.quote.documentKey).toBe('quotes/173000-soporte.pdf');
    expect(result.documentUrl).toBe(
      'https://s3.amazonaws.com/quotes/173000-soporte.pdf',
    );
  });

  it('throws QuoteNotFoundError if quote is not found', async () => {
    vi.mocked(quoteRepository.findById!).mockResolvedValue(null);

    const file = {
      buffer: Buffer.from('dummy pdf content'),
      originalname: 'soporte.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    };

    await expect(useCase.execute(999, file)).rejects.toThrow(
      QuoteNotFoundError,
    );
    expect(fileStorageService.upload).not.toHaveBeenCalled();
  });
});
