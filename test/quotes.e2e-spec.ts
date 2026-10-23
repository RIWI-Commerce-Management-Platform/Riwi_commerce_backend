import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateQuoteFromVisitUseCase } from '../src/modules/quotes/application/create-quote-from-visit.use-case.js';
import { CreateQuoteUseCase } from '../src/modules/quotes/application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../src/modules/quotes/application/get-quote-by-id.use-case.js';
import { Quote } from '../src/modules/quotes/domain/quote.entity.js';
import { QuoteStatus } from '../src/modules/quotes/domain/quote-status.enum.js';
import { QuotesController } from '../src/modules/quotes/presentation/quotes.controller.js';
import { CurrentAdvisorProvider } from '../src/shared/auth/domain/current-advisor.provider.js';
import { HeaderCurrentAdvisorProvider } from '../src/shared/auth/infrastructure/header-current-advisor.provider.js';

describe('QuotesController from-visit flow (e2e)', () => {
  let app: INestApplication<App>;
  let createQuoteFromVisit: { execute: ReturnType<typeof vi.fn> };

  const quote = new Quote({
    id: 18,
    quoteNumber: 'COT-0018',
    clientId: 12,
    status: QuoteStatus.DRAFT,
    subtotal: 25,
    total: 25,
    notes: 'Prepared during visit',
    documentKey: null,
    items: [],
    createdAt: new Date('2026-10-22T12:00:00.000Z'),
    updatedAt: new Date('2026-10-22T12:00:00.000Z'),
  });

  beforeEach(async () => {
    createQuoteFromVisit = {
      execute: vi.fn().mockResolvedValue(quote),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: CreateQuoteUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: CreateQuoteFromVisitUseCase,
          useValue: createQuoteFromVisit,
        },
        {
          provide: GetQuoteByIdUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: CurrentAdvisorProvider,
          useClass: HeaderCurrentAdvisorProvider,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates the quote only on submission and does not accept a client ID from the body', async () => {
    await request(app.getHttpServer())
      .post('/quotes/from-visits/45')
      .set('x-user-id', '20')
      .send({
        clientId: 999,
        notes: 'Prepared during visit',
        items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 18,
          quoteNumber: 'COT-0018',
          clientId: 12,
        });
      });

    expect(createQuoteFromVisit.execute).toHaveBeenCalledWith(45, 20, {
      notes: 'Prepared during visit',
      documentKey: undefined,
      items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
    });
  });

  it('rejects invalid quote items before creating a quote', async () => {
    await request(app.getHttpServer())
      .post('/quotes/from-visits/45')
      .set('x-user-id', '20')
      .send({
        items: [{ productName: 'Product', quantity: 0, unitPrice: 25 }],
      })
      .expect(400);

    expect(createQuoteFromVisit.execute).not.toHaveBeenCalled();
  });

  it('requires the existing advisor identity header', async () => {
    await request(app.getHttpServer())
      .post('/quotes/from-visits/45')
      .send({
        items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
      })
      .expect(401);

    expect(createQuoteFromVisit.execute).not.toHaveBeenCalled();
  });
});
