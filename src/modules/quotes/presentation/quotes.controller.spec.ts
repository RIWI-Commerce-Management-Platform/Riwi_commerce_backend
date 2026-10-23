import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { FileSizeExceededError } from '../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../../../shared/file-storage/domain/errors/invalid-file-type.error.js';
import { CreateQuoteFromVisitUseCase } from '../application/create-quote-from-visit.use-case.js';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { AttachQuoteDocumentUseCase } from '../application/attach-quote-document.use-case.js';
import { ChangeQuoteStatusUseCase } from '../application/change-quote-status.use-case.js';
import { ListQuotesUseCase } from '../application/list-quotes.use-case.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';
import { InvalidQuoteStatusTransitionError } from '../domain/errors/invalid-quote-status-transition.error.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { ListQuotesQueryDto } from './dto/list-quotes-query.dto.js';
import { QuotesController } from './quotes.controller.js';

describe('QuotesController', () => {
  let controller: QuotesController;
  let createQuoteUseCase: Partial<CreateQuoteUseCase>;
  let createQuoteFromVisitUseCase: Partial<CreateQuoteFromVisitUseCase>;
  let getQuoteByIdUseCase: Partial<GetQuoteByIdUseCase>;
  let attachQuoteDocumentUseCase: Partial<AttachQuoteDocumentUseCase>;
  let changeQuoteStatusUseCase: Partial<ChangeQuoteStatusUseCase>;
  let listQuotesUseCase: Partial<ListQuotesUseCase>;
  let currentAdvisor: Partial<CurrentAdvisorProvider>;

  const mockQuote = new Quote({
    id: 1,
    quoteNumber: 'COT-0001',
    clientId: 12,
    status: QuoteStatus.DRAFT,
    subtotal: 150,
    total: 150,
    documentKey: 'quotes/173000-doc.pdf',
    items: [],
    createdAt: new Date('2026-10-22T12:00:00.000Z'),
    updatedAt: new Date('2026-10-22T12:00:00.000Z'),
  });

  beforeEach(() => {
    createQuoteUseCase = {
      execute: vi.fn().mockResolvedValue(mockQuote),
    };
    createQuoteFromVisitUseCase = {
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
    currentAdvisor = {
      extract: vi.fn().mockResolvedValue(15),
    };

    controller = new QuotesController(
      createQuoteUseCase as CreateQuoteUseCase,
      createQuoteFromVisitUseCase as CreateQuoteFromVisitUseCase,
      getQuoteByIdUseCase as GetQuoteByIdUseCase,
      attachQuoteDocumentUseCase as AttachQuoteDocumentUseCase,
      changeQuoteStatusUseCase as ChangeQuoteStatusUseCase,
      listQuotesUseCase as ListQuotesUseCase,
      currentAdvisor as CurrentAdvisorProvider,
    );
  });

  it('creates a quote', async () => {
    const response = await controller.create({
      clientId: 12,
      items: [{ productName: 'Laptop', quantity: 1, unitPrice: 150 }],
    });

    expect(createQuoteUseCase.execute).toHaveBeenCalledWith({
      clientId: 12,
      notes: undefined,
      documentKey: undefined,
      items: [{ productName: 'Laptop', quantity: 1, unitPrice: 150 }],
    });
    expect(response.quoteNumber).toBe('COT-0001');
  });

  it('translates a missing client on create to NotFoundException', async () => {
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

  it('creates a quote from the authorized visit without accepting a client ID', async () => {
    const request = {
      headers: { 'x-user-id': '15' },
    } as unknown as Request;
    const response = await controller.createFromVisit(45, request, {
      notes: 'Visit quote',
      items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
    });

    expect(currentAdvisor.extract).toHaveBeenCalledWith(request);
    expect(createQuoteFromVisitUseCase.execute).toHaveBeenCalledWith(45, 15, {
      notes: 'Visit quote',
      documentKey: undefined,
      items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
    });
    expect(response.clientId).toBe(12);
  });

  it('translates a missing visit client to NotFoundException', async () => {
    vi.mocked(createQuoteFromVisitUseCase.execute!).mockRejectedValue(
      new ClientNotFoundError(999),
    );

    await expect(
      controller.createFromVisit(
        45,
        { headers: { 'x-user-id': '15' } } as unknown as Request,
        { items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }] },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns a paginated list of quotes', async () => {
    const query = new ListQuotesQueryDto();
    query.page = 1;
    query.limit = 10;
    query.clientId = 12;
    query.status = QuoteStatus.DRAFT;

    const result = await controller.list(query);

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(listQuotesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 12,
        status: QuoteStatus.DRAFT,
        page: 1,
        limit: 10,
      }),
    );
  });

  it('returns quote details and the presigned document URL', async () => {
    const response = await controller.getById(1);

    expect(getQuoteByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(response.id).toBe(1);
    expect(response.documentUrl).toBe(
      'https://s3.amazonaws.com/quotes/173000-doc.pdf',
    );
  });

  it('translates a missing quote on get to NotFoundException', async () => {
    vi.mocked(getQuoteByIdUseCase.execute!).mockRejectedValue(
      new QuoteNotFoundError(999),
    );

    await expect(controller.getById(999)).rejects.toThrow(NotFoundException);
  });

  it('rejects a missing attachment file', async () => {
    await expect(controller.attachDocument(1, undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('attaches a document and returns its presigned URL', async () => {
    const file = {
      buffer: Buffer.from('test'),
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 100,
    };

    const response = await controller.attachDocument(1, file);

    expect(attachQuoteDocumentUseCase.execute).toHaveBeenCalledWith(1, file);
    expect(response.id).toBe(1);
    expect(response.documentUrl).toBe(
      'https://s3.amazonaws.com/quotes/173000-doc.pdf',
    );
  });

  it('translates a missing quote on attachment to NotFoundException', async () => {
    vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValue(
      new QuoteNotFoundError(999),
    );

    await expect(
      controller.attachDocument(999, {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 100,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('translates an oversized attachment to BadRequestException', async () => {
    vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValue(
      new FileSizeExceededError(1024),
    );

    await expect(
      controller.attachDocument(1, {
        buffer: Buffer.from('huge'),
        originalname: 'big.pdf',
        mimetype: 'application/pdf',
        size: 2048,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('translates an invalid attachment type to BadRequestException', async () => {
    vi.mocked(attachQuoteDocumentUseCase.execute!).mockRejectedValue(
      new InvalidFileTypeError('application/exe', ['application/pdf']),
    );

    await expect(
      controller.attachDocument(1, {
        buffer: Buffer.from('bad'),
        originalname: 'virus.exe',
        mimetype: 'application/exe',
        size: 100,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('changes quote status and records the authenticated actor', async () => {
    const request = {
      headers: { 'x-user-id': '15' },
    } as unknown as Request;
    const response = await controller.changeStatus(
      1,
      { status: QuoteStatus.SENT },
      request,
    );

    expect(currentAdvisor.extract).toHaveBeenCalledWith(request);
    expect(changeQuoteStatusUseCase.execute).toHaveBeenCalledWith({
      quoteId: 1,
      newStatus: QuoteStatus.SENT,
      actorId: 15,
    });
    expect(response.quoteNumber).toBe('COT-0001');
  });

  it('does not change status when advisor resolution fails', async () => {
    vi.mocked(currentAdvisor.extract!).mockRejectedValue(
      new UnauthorizedException(),
    );

    await expect(
      controller.changeStatus(1, { status: QuoteStatus.SENT }, {
        headers: {},
      } as unknown as Request),
    ).rejects.toThrow(UnauthorizedException);
    expect(changeQuoteStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('translates an invalid status transition to BadRequestException', async () => {
    vi.mocked(changeQuoteStatusUseCase.execute!).mockRejectedValue(
      new InvalidQuoteStatusTransitionError(
        QuoteStatus.APPROVED,
        QuoteStatus.DRAFT,
      ),
    );

    await expect(
      controller.changeStatus(1, { status: QuoteStatus.DRAFT }, {
        headers: {},
      } as unknown as Request),
    ).rejects.toThrow(BadRequestException);
  });

  it('translates a missing quote on status change to NotFoundException', async () => {
    vi.mocked(changeQuoteStatusUseCase.execute!).mockRejectedValue(
      new QuoteNotFoundError(999),
    );

    await expect(
      controller.changeStatus(999, { status: QuoteStatus.SENT }, {
        headers: {},
      } as unknown as Request),
    ).rejects.toThrow(NotFoundException);
  });
});
