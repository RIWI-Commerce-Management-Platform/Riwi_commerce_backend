import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';

import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { CreateQuoteFromVisitUseCase } from '../application/create-quote-from-visit.use-case.js';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuotesController } from './quotes.controller.js';

function buildQuote(clientId = 12) {
  return new Quote({
    id: 1,
    quoteNumber: 'COT-0001',
    clientId,
    status: QuoteStatus.DRAFT,
    subtotal: 25,
    total: 25,
    notes: null,
    documentKey: null,
    items: [],
    createdAt: new Date('2026-10-22T12:00:00.000Z'),
    updatedAt: new Date('2026-10-22T12:00:00.000Z'),
  });
}

describe('QuotesController', () => {
  let controller: QuotesController;
  let createQuote: { execute: ReturnType<typeof vi.fn> };
  let createQuoteFromVisit: { execute: ReturnType<typeof vi.fn> };
  let getQuoteById: { execute: ReturnType<typeof vi.fn> };
  let currentAdvisor: { extract: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    createQuote = { execute: vi.fn().mockResolvedValue(buildQuote()) };
    createQuoteFromVisit = {
      execute: vi.fn().mockResolvedValue(buildQuote()),
    };
    getQuoteById = { execute: vi.fn() };
    currentAdvisor = { extract: vi.fn().mockResolvedValue(20) };

    controller = new QuotesController(
      createQuote as unknown as CreateQuoteUseCase,
      createQuoteFromVisit as unknown as CreateQuoteFromVisitUseCase,
      getQuoteById as unknown as GetQuoteByIdUseCase,
      currentAdvisor as unknown as CurrentAdvisorProvider,
    );
  });

  it('creates a quote from the authorized visit without accepting a client ID', async () => {
    const request = {
      headers: { 'x-user-id': '20' },
    } as unknown as Request;
    const result = await controller.createFromVisit(45, request, {
      notes: 'Visit quote',
      items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
    });

    expect(currentAdvisor.extract).toHaveBeenCalledWith(request);
    expect(createQuoteFromVisit.execute).toHaveBeenCalledWith(45, 20, {
      notes: 'Visit quote',
      documentKey: undefined,
      items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
    });
    expect(result.clientId).toBe(12);
  });
});
