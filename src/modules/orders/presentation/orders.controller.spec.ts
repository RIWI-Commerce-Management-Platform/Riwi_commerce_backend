import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersController } from './orders.controller.js';
import { ConvertQuoteToOrderUseCase } from '../application/convert-quote-to-order.use-case.js';
import { GetOrderByIdUseCase } from '../application/get-order-by-id.use-case.js';
import { ChangeOrderStatusUseCase } from '../application/change-order-status.use-case.js';
import { ListOrdersUseCase } from '../application/list-orders.use-case.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';

describe('OrdersController (Presentation)', () => {
  let controller: OrdersController;
  let convertQuoteToOrderUseCase: Partial<ConvertQuoteToOrderUseCase>;
  let getOrderByIdUseCase: Partial<GetOrderByIdUseCase>;
  let changeOrderStatusUseCase: Partial<ChangeOrderStatusUseCase>;
  let listOrdersUseCase: Partial<ListOrdersUseCase>;
  let currentAdvisor: Partial<CurrentAdvisorProvider>;

  const mockOrder = new Order({
    id: 1,
    orderNumber: 'PED-0001',
    quoteId: 10,
    clientId: 5,
    status: OrderStatus.CREATED,
    subtotal: 500,
    total: 500,
    items: [],
  });

  beforeEach(() => {
    convertQuoteToOrderUseCase = {
      execute: vi.fn().mockResolvedValue(mockOrder),
    };

    getOrderByIdUseCase = {
      execute: vi.fn().mockResolvedValue(mockOrder),
    };

    changeOrderStatusUseCase = {
      execute: vi.fn().mockResolvedValue(mockOrder),
    };

    listOrdersUseCase = {
      execute: vi.fn().mockResolvedValue({
        data: [mockOrder],
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
      extract: vi.fn().mockResolvedValue(12),
    };

    controller = new OrdersController(
      convertQuoteToOrderUseCase as ConvertQuoteToOrderUseCase,
      getOrderByIdUseCase as GetOrderByIdUseCase,
      changeOrderStatusUseCase as ChangeOrderStatusUseCase,
      listOrdersUseCase as ListOrdersUseCase,
      currentAdvisor as CurrentAdvisorProvider,
    );
  });

  describe('POST /orders/from-quote/:quoteId (HU-33)', () => {
    it('creates order from quote successfully', async () => {
      const req = { headers: {} } as any;
      const response = await controller.createFromQuote(10, req);

      expect(convertQuoteToOrderUseCase.execute).toHaveBeenCalledWith({
        quoteId: 10,
        actorId: 12,
      });
      expect(response.orderNumber).toBe('PED-0001');
    });

    it('defaults actorId to 1 when currentAdvisor extraction fails', async () => {
      vi.mocked(currentAdvisor.extract!).mockRejectedValue(new Error('fail'));
      const req = { headers: {} } as any;
      const response = await controller.createFromQuote(10, req);

      expect(convertQuoteToOrderUseCase.execute).toHaveBeenCalledWith({
        quoteId: 10,
        actorId: 1,
      });
      expect(response.orderNumber).toBe('PED-0001');
    });

    it('translates QuoteNotFoundError to NotFoundException', async () => {
      vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(
        new QuoteNotFoundError(99),
      );
      const req = { headers: {} } as any;

      await expect(controller.createFromQuote(99, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('translates QuoteNotApprovedForOrderError to BadRequestException', async () => {
      vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(
        new QuoteNotApprovedForOrderError('COT-0001', 'DRAFT'),
      );
      const req = { headers: {} } as any;

      await expect(controller.createFromQuote(10, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('translates QuoteAlreadyConvertedError to BadRequestException', async () => {
      vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(
        new QuoteAlreadyConvertedError(10, 'PED-0001'),
      );
      const req = { headers: {} } as any;

      await expect(controller.createFromQuote(10, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rethrows unexpected errors', async () => {
      const err = new Error('db error');
      vi.mocked(convertQuoteToOrderUseCase.execute!).mockRejectedValue(err);
      const req = { headers: {} } as any;

      await expect(controller.createFromQuote(10, req)).rejects.toThrow(err);
    });
  });

  describe('GET /orders (HU-34)', () => {
    it('returns paginated list of orders', async () => {
      const query = new ListOrdersQueryDto();
      query.page = 1;
      query.limit = 10;
      query.clientId = 5;

      const result = await controller.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(listOrdersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 5,
          page: 1,
          limit: 10,
        }),
      );
    });
  });

  describe('GET /orders/:id (HU-33)', () => {
    it('returns order by ID', async () => {
      const response = await controller.getById(1);
      expect(response.id).toBe(1);
      expect(getOrderByIdUseCase.execute).toHaveBeenCalledWith(1);
    });

    it('translates OrderNotFoundError to NotFoundException', async () => {
      vi.mocked(getOrderByIdUseCase.execute!).mockRejectedValue(
        new OrderNotFoundError(999),
      );

      await expect(controller.getById(999)).rejects.toThrow(NotFoundException);
    });

    it('rethrows unexpected errors', async () => {
      const err = new Error('db down');
      vi.mocked(getOrderByIdUseCase.execute!).mockRejectedValue(err);

      await expect(controller.getById(1)).rejects.toThrow(err);
    });
  });

  describe('PATCH /orders/:id/status (HU-33)', () => {
    it('changes order status successfully', async () => {
      const req = { headers: {} } as any;
      const response = await controller.changeStatus(
        1,
        { status: OrderStatus.DISPATCHED },
        req,
      );

      expect(changeOrderStatusUseCase.execute).toHaveBeenCalledWith({
        orderId: 1,
        newStatus: OrderStatus.DISPATCHED,
        actorId: 12,
      });
      expect(response.orderNumber).toBe('PED-0001');
    });

    it('defaults actorId to 1 when currentAdvisor extraction fails', async () => {
      vi.mocked(currentAdvisor.extract!).mockRejectedValue(new Error('fail'));
      const req = { headers: {} } as any;
      const response = await controller.changeStatus(
        1,
        { status: OrderStatus.DISPATCHED },
        req,
      );

      expect(changeOrderStatusUseCase.execute).toHaveBeenCalledWith({
        orderId: 1,
        newStatus: OrderStatus.DISPATCHED,
        actorId: 1,
      });
      expect(response.orderNumber).toBe('PED-0001');
    });

    it('translates OrderNotFoundError to NotFoundException', async () => {
      vi.mocked(changeOrderStatusUseCase.execute!).mockRejectedValue(
        new OrderNotFoundError(999),
      );
      const req = { headers: {} } as any;

      await expect(
        controller.changeStatus(999, { status: OrderStatus.DISPATCHED }, req),
      ).rejects.toThrow(NotFoundException);
    });

    it('translates InvalidOrderStatusTransitionError to BadRequestException', async () => {
      vi.mocked(changeOrderStatusUseCase.execute!).mockRejectedValue(
        new InvalidOrderStatusTransitionError(
          OrderStatus.CREATED,
          OrderStatus.DELIVERED,
        ),
      );
      const req = { headers: {} } as any;

      await expect(
        controller.changeStatus(1, { status: OrderStatus.DELIVERED }, req),
      ).rejects.toThrow(BadRequestException);
    });

    it('rethrows unexpected errors', async () => {
      const err = new Error('db error');
      vi.mocked(changeOrderStatusUseCase.execute!).mockRejectedValue(err);
      const req = { headers: {} } as any;

      await expect(
        controller.changeStatus(1, { status: OrderStatus.DISPATCHED }, req),
      ).rejects.toThrow(err);
    });
  });
});
