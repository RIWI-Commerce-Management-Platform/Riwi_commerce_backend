import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuotesController } from './quotes.controller.js';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { AttachQuoteDocumentUseCase } from '../application/attach-quote-document.use-case.js';
import { ChangeQuoteStatusUseCase } from '../application/change-quote-status.use-case.js';
import { ListQuotesUseCase } from '../application/list-quotes.use-case.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';
import { InvalidQuoteStatusTransitionError } from '../domain/errors/invalid-quote-status-transition.error.js';
import { FileSizeExceededError } from '../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../../../shared/file-storage/domain/errors/invalid-file-type.error.js';
import { ListQuotesQueryDto } from './dto/list-quotes-query.dto.js';

describe('QuotesController (Presentation)', () => {
  let controller: QuotesController;
  let createQuoteUseCase: Partial<CreateQuoteUseCase>;
  let getQuoteByIdUseCase: Partial<GetQuoteByIdUseCase>;
  let attachQuoteDocumentUseCase: Partial<AttachQuoteDocumentUseCase>;
  let changeQuoteStatusUseCase: Partial<ChangeQuoteStatusUseCase>;
  let listQuotesUseCase: Partial<ListQuotesUseCase>;
  let currentAdvisor: Partial<CurrentAdvisorProvider>;
  let currentActor: { extract: ReturnType<typeof vi.fn> };
  const actor = { id: 7, role: 'ASESOR', zoneId: null };

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

    changeQuoteStatusUseCase = {
      execute: vi.fn().mockResolvedValue(mockQuote),
    };

    listQuotesUseCase = {
      execute: vi.fn().mockResolvedValue({
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
    };

    currentActor = {
      extract: vi.fn().mockResolvedValue(actor),
    };
    currentAdvisor = {
      extract: vi.fn().mockResolvedValue(15),
    };

    controller = new QuotesController(
      createQuoteUseCase as CreateQuoteUseCase,
      getQuoteByIdUseCase as GetQuoteByIdUseCase,
      attachQuoteDocumentUseCase as AttachQuoteDocumentUseCase,
      changeQuoteStatusUseCase as ChangeQuoteStatusUseCase,
      listQuotesUseCase as ListQuotesUseCase,
      currentAdvisor as CurrentAdvisorProvider,
      currentActor as any,
    );
  });

  describe('POST /quotes (HU-30)', () => {
    it('creates a new quote and returns QuoteResponseDto', async () => {
      const response = await controller.create(
        {
          clientId: 10,
          visitId: 3,
          items: [{ productName: 'Laptop', quantity: 1, unitPrice: 150 }],
        },
        {} as any,
      );

      expect(createQuoteUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 10, advisorId: 15, visitId: 3 }),
      );
      expect(response.quoteNumber).toBe('COT-0001');
    });

    it('translates ClientNotFoundError to NotFoundException', async () => {
      vi.mocked(createQuoteUseCase.execute!).mockRejectedValue(
        new ClientNotFoundError(999),
      );

      await expect(
        controller.create(
          {
            clientId: 999,
            items: [{ productName: 'Laptop', quantity: 1, unitPrice: 150 }],
          },
          {} as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /quotes (HU-34)', () => {
    it('returns paginated list of quotes', async () => {
      const query = new ListQuotesQueryDto();
      query.page = 1;
      query.limit = 10;
      query.clientId = 10;
      query.status = QuoteStatus.DRAFT;

      const result = await controller.list(query, {} as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(listQuotesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 10,
          status: QuoteStatus.DRAFT,
          page: 1,
          limit: 10,
        }),
        actor,
      );
    });
  });

  describe('GET /quotes/:id', () => {
    it('returns quote details with presigned url', async () => {
      const response = await controller.getById(1, {} as any);

      expect(getQuoteByIdUseCase.execute).toHaveBeenCalledWith(1, actor);
      expect(response.id).toBe(1);
      expect(response.documentUrl).toBe(
        'https://s3.amazonaws.com/quotes/173000-doc.pdf',
      );
    });

    it('translates QuoteNotFoundError to NotFoundException', async () => {
      vi.mocked(getQuoteByIdUseCase.execute!).mockRejectedValue(
        new QuoteNotFoundError(999),
      );

      await expect(controller.getById(999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
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

  describe('PATCH /quotes/:id/status (HU-32)', () => {
    it('successfully changes status and returns updated QuoteResponseDto', async () => {
      const req = { user: { id: 15 } } as any;
      const response = await controller.changeStatus(
        1,
        { status: QuoteStatus.SENT },
        req,
      );

      expect(changeQuoteStatusUseCase.execute).toHaveBeenCalledWith({
        quoteId: 1,
        newStatus: QuoteStatus.SENT,
        actorId: 15,
      });
      expect(response.quoteNumber).toBe('COT-0001');
    });

    it('rejects the request when there is no authenticated session', async () => {
      vi.mocked(currentAdvisor.extract!).mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(
        controller.changeStatus(1, { status: QuoteStatus.SENT }, {} as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(changeQuoteStatusUseCase.execute).not.toHaveBeenCalled();
    });

    it('translates InvalidQuoteStatusTransitionError to BadRequestException', async () => {
      vi.mocked(changeQuoteStatusUseCase.execute!).mockRejectedValue(
        new InvalidQuoteStatusTransitionError(
          QuoteStatus.APPROVED,
          QuoteStatus.DRAFT,
        ),
      );

      const req = { headers: {} } as any;
      await expect(
        controller.changeStatus(1, { status: QuoteStatus.DRAFT }, req),
      ).rejects.toThrow(BadRequestException);
    });

    it('translates QuoteNotFoundError to NotFoundException', async () => {
      vi.mocked(changeQuoteStatusUseCase.execute!).mockRejectedValue(
        new QuoteNotFoundError(999),
      );

      const req = { headers: {} } as any;
      await expect(
        controller.changeStatus(999, { status: QuoteStatus.SENT }, req),
      ).rejects.toThrow(NotFoundException);
    });

    it('rethrows unexpected errors across all controller methods', async () => {
      const dbError = new Error('Database down');
      const req = { headers: {} } as any;

      vi.mocked(createQuoteUseCase.execute!).mockRejectedValueOnce(dbError);
      await expect(
        controller.create({ clientId: 1, items: [] }, req),
      ).rejects.toThrow(dbError);

      vi.mocked(getQuoteByIdUseCase.execute!).mockRejectedValueOnce(dbError);
      await expect(controller.getById(1, {} as any)).rejects.toThrow(dbError);

      vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValueOnce(
        dbError,
      );
      await expect(
        controller.attachDocument(
          1,
          { originalname: 'doc.pdf', buffer: Buffer.from('') } as any,
          req,
        ),
      ).rejects.toThrow(dbError);

      vi.mocked(changeQuoteStatusUseCase.execute!).mockRejectedValueOnce(
        dbError,
      );
      await expect(
        controller.changeStatus(1, { status: QuoteStatus.SENT }, req),
      ).rejects.toThrow(dbError);
    });
  });
});
