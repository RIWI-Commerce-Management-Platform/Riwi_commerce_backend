import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetOrderByIdUseCase } from './get-order-by-id.use-case.js';
import { OrderRepository } from '../domain/order.repository.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';

describe('GetOrderByIdUseCase (Application)', () => {
  let useCase: GetOrderByIdUseCase;
  let orderRepository: Partial<OrderRepository>;

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
    orderRepository = {
      findById: vi.fn().mockResolvedValue(mockOrder),
    };

    useCase = new GetOrderByIdUseCase(orderRepository as OrderRepository);
  });

  it('retrieves order by id successfully', async () => {
    const result = await useCase.execute(1);
    expect(result.id).toBe(1);
    expect(result.orderNumber).toBe('PED-0001');
    expect(orderRepository.findById).toHaveBeenCalledWith(1);
  });

  it('throws OrderNotFoundError when order does not exist', async () => {
    vi.mocked(orderRepository.findById!).mockResolvedValue(null);
    await expect(useCase.execute(999)).rejects.toThrow(OrderNotFoundError);
  });
});
