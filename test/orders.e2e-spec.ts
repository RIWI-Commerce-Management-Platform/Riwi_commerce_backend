import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConvertQuoteToOrderUseCase } from '../src/modules/orders/application/convert-quote-to-order.use-case.js';
import { CreateOrderFromVisitUseCase } from '../src/modules/orders/application/create-order-from-visit.use-case.js';
import { ChangeOrderStatusUseCase } from '../src/modules/orders/application/change-order-status.use-case.js';
import { GetOrderByIdUseCase } from '../src/modules/orders/application/get-order-by-id.use-case.js';
import { ListOrdersUseCase } from '../src/modules/orders/application/list-orders.use-case.js';
import { Order } from '../src/modules/orders/domain/order.entity.js';
import { OrderStatus } from '../src/modules/orders/domain/order-status.enum.js';
import { OrdersController } from '../src/modules/orders/presentation/orders.controller.js';
import { CurrentAdvisorProvider } from '../src/shared/auth/domain/current-advisor.provider.js';
import { HeaderCurrentAdvisorProvider } from '../src/shared/auth/infrastructure/header-current-advisor.provider.js';

describe('OrdersController from-visit flow (e2e)', () => {
  let app: INestApplication<App>;
  let createOrderFromVisit: { execute: ReturnType<typeof vi.fn> };

  const order = new Order({
    id: 3,
    orderNumber: 'PED-0003',
    quoteId: 8,
    clientId: 12,
    status: OrderStatus.CREATED,
    subtotal: 100,
    total: 100,
    items: [],
  });

  beforeEach(async () => {
    createOrderFromVisit = {
      execute: vi.fn().mockResolvedValue(order),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: ConvertQuoteToOrderUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: CreateOrderFromVisitUseCase,
          useValue: createOrderFromVisit,
        },
        {
          provide: GetOrderByIdUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: ChangeOrderStatusUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: ListOrdersUseCase,
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

  it('creates an order using the advisor-owned visit and selected quote', async () => {
    await request(app.getHttpServer())
      .post('/orders/from-visits/41')
      .set('x-user-id', '7')
      .send({ quoteId: 8 })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 3,
          orderNumber: 'PED-0003',
          quoteId: 8,
          clientId: 12,
        });
      });

    expect(createOrderFromVisit.execute).toHaveBeenCalledWith({
      visitId: 41,
      advisorId: 7,
      quoteId: 8,
    });
  });

  it('requires advisor identity and a positive quote ID', async () => {
    await request(app.getHttpServer())
      .post('/orders/from-visits/41')
      .send({ quoteId: 8 })
      .expect(401);

    await request(app.getHttpServer())
      .post('/orders/from-visits/41')
      .set('x-user-id', '7')
      .send({ quoteId: 0 })
      .expect(400);

    expect(createOrderFromVisit.execute).not.toHaveBeenCalled();
  });
});
