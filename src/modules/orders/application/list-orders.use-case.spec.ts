import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListOrdersUseCase } from './list-orders.use-case.js';
import { OrderDao } from '../domain/order.dao.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';

describe('ListOrdersUseCase (Application - HU-34)', () => {
  let useCase: ListOrdersUseCase;
  let orderDao: Partial<OrderDao>;

  const mockOrder = new Order({
    id: 1,
    orderNumber: 'PED-0001',
    quoteId: 10,
    clientId: 5,
    status: OrderStatus.CREATED,
    subtotal: 300,
    total: 300,
    items: [],
  });

  beforeEach(() => {
    orderDao = {
      findPaginated: vi.fn().mockResolvedValue({
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

    useCase = new ListOrdersUseCase(orderDao as OrderDao);
  });

  it('lists paginated orders with applied filters', async () => {
    const filter = {
      clientId: 5,
      status: OrderStatus.CREATED,
      page: 1,
      limit: 10,
    };
    const result = await useCase.execute(filter);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].orderNumber).toBe('PED-0001');
    expect(orderDao.findPaginated).toHaveBeenCalledWith(filter);
  });
});
