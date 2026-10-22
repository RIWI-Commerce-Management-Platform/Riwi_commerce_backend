import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuotesController } from './quotes.controller.js';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { AttachQuoteDocumentUseCase } from '../application/attach-quote-document.use-case.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';
import { FileSizeExceededError } from '../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../../../shared/file-storage/domain/errors/invalid-file-type.error.js';

describe('QuotesController (Presentation - HU-31)', () => {
  let controller: QuotesController;
  let createQuoteUseCase: Partial<CreateQuoteUseCase>;
  let getQuoteByIdUseCase: Partial<GetQuoteByIdUseCase>;
  let attachQuoteDocumentUseCase: Partial<AttachQuoteDocumentUseCase>;

  const mockQuote = new Quote({
    id: 1,
    quoteNumber: 'COT-0001',
    clientId: 10,
    status: QuoteStatus.DRAFT,
    subtotal: 150,
    total: 150,
    documentKey: 'quotes/173000-doc.pdf',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    createQuoteUseCase = {
      execute: vi.fn().mockResolvedValue(mockQuote),
    };

    getQuoteByIdUseCase = {
      execute: vi.fn().mockResolvedValue({
        quote: mockQuote,
        documentUrl: 'https://s3.amazonaws.com/quotes/173000-doc.pdf',
      }),
    };

    attachQuoteDocumentUseCase = {
      execute: vi.fn().mockResolvedValue({
        quote: mockQuote,
        documentUrl: 'https://s3.amazonaws.com/quotes/173000-doc.pdf',
      }),
    };

    controller = new QuotesController(
      createQuoteUseCase as CreateQuoteUseCase,
      getQuoteByIdUseCase as GetQuoteByIdUseCase,
      attachQuoteDocumentUseCase as AttachQuoteDocumentUseCase,
    );
  });

  describe('POST /quotes (HU-30)', () => {
    it('creates a new quote and returns QuoteResponseDto', async () => {
      const response = await controller.create({
        clientId: 10,
        items: [{ productName: 'Laptop', quantity: 1, unitPrice: 150 }],
      });

      expect(createQuoteUseCase.execute).toHaveBeenCalled();
      expect(response.quoteNumber).toBe('COT-0001');
    });

    it('translates ClientNotFoundError to NotFoundException', async () => {
      vi.mocked(createQuoteUseCase.execute!).mockRejectedValue(
        new ClientNotFoundError(999),
      );

      await expect(
        controller.create({
          clientId: 999,
          items: [{ productName: 'Laptop', quantity: 1, unitPrice: 150 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /quotes/:id', () => {
    it('returns quote details with presigned url', async () => {
      const response = await controller.getById(1);

      expect(getQuoteByIdUseCase.execute).toHaveBeenCalledWith(1);
      expect(response.id).toBe(1);
      expect(response.documentUrl).toBe(
        'https://s3.amazonaws.com/quotes/173000-doc.pdf',
      );
    });

    it('translates QuoteNotFoundError to NotFoundException', async () => {
      vi.mocked(getQuoteByIdUseCase.execute!).mockRejectedValue(
        new QuoteNotFoundError(999),
      );

      await expect(controller.getById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /quotes/:id/attachment (HU-31)', () => {
    it('throws BadRequestException if no file is provided', async () => {
      await expect(controller.attachDocument(1, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('attaches file to quote and returns response DTO with documentUrl', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 100,
      } as any;

      const response = await controller.attachDocument(1, mockFile);

      expect(attachQuoteDocumentUseCase.execute).toHaveBeenCalledWith(
        1,
        mockFile,
      );
      expect(response.id).toBe(1);
      expect(response.documentUrl).toBe(
        'https://s3.amazonaws.com/quotes/173000-doc.pdf',
      );
    });

    it('translates QuoteNotFoundError to NotFoundException', async () => {
      vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValue(
        new QuoteNotFoundError(999),
      );

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 100,
      } as any;

      await expect(controller.attachDocument(999, mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('translates FileSizeExceededError to BadRequestException', async () => {
      vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValue(
        new FileSizeExceededError(1024),
      );

      const mockFile = {
        buffer: Buffer.from('huge'),
        originalname: 'big.pdf',
        mimetype: 'application/pdf',
        size: 2048,
      } as any;

      await expect(controller.attachDocument(1, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('translates InvalidFileTypeError to BadRequestException', async () => {
      vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValue(
        new InvalidFileTypeError('application/exe', ['application/pdf']),
      );

      const mockFile = {
        buffer: Buffer.from('bad'),
        originalname: 'virus.exe',
        mimetype: 'application/exe',
        size: 100,
      } as any;

      await expect(controller.attachDocument(1, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
