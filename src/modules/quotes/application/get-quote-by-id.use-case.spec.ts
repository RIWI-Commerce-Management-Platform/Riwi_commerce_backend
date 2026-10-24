import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetQuoteByIdUseCase } from './get-quote-by-id.use-case.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { FileStorageService } from '../../../shared/file-storage/domain/file-storage.service.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';

describe('GetQuoteByIdUseCase', () => {
  let useCase: GetQuoteByIdUseCase;
  let quoteRepository: Partial<QuoteRepository>;
  let fileStorageService: Partial<FileStorageService>;

  const mockQuote = new Quote({
    id: 1,
    quoteNumber: 'COT-0001',
    clientId: 10,
    status: QuoteStatus.DRAFT,
    subtotal: 500,
    total: 500,
    documentKey: 'quotes/soporte.pdf',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    quoteRepository = {
      findById: vi.fn().mockResolvedValue(mockQuote),
    };
    fileStorageService = {
      getPresignedUrl: vi
        .fn()
        .mockResolvedValue('https://s3.amazonaws.com/quotes/soporte.pdf'),
    };
    useCase = new GetQuoteByIdUseCase(
      quoteRepository as QuoteRepository,
      fileStorageService as FileStorageService,
    );
  });

  it('returns quote and generates presigned url when documentKey is present', async () => {
    const result = await useCase.execute(1);

    expect(quoteRepository.findById).toHaveBeenCalledWith(1, {});
    expect(fileStorageService.getPresignedUrl).toHaveBeenCalledWith(
      'quotes/soporte.pdf',
    );
    expect(result.quote).toBe(mockQuote);
    expect(result.documentUrl).toBe(
      'https://s3.amazonaws.com/quotes/soporte.pdf',
    );
  });

  it('returns quote with null documentUrl when documentKey is null', async () => {
    const quoteWithoutDoc = new Quote({
      id: 2,
      quoteNumber: 'COT-0002',
      clientId: 10,
      status: QuoteStatus.DRAFT,
      subtotal: 500,
      total: 500,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(quoteRepository.findById!).mockResolvedValue(quoteWithoutDoc);

    const result = await useCase.execute(2);

    expect(result.quote).toBe(quoteWithoutDoc);
    expect(result.documentUrl).toBeNull();
    expect(fileStorageService.getPresignedUrl).not.toHaveBeenCalled();
  });

  it('throws QuoteNotFoundError if quote does not exist', async () => {
    vi.mocked(quoteRepository.findById!).mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(QuoteNotFoundError);
  });
});
