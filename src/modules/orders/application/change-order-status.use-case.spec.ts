import { UserRole } from '../../auth/domain/user-role.enum.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeOrderStatusUseCase } from './change-order-status.use-case.js';
import { OrderDao } from '../domain/order.dao.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error.js';

describe('ChangeOrderStatusUseCase (Application)', () => {
  let useCase: ChangeOrderStatusUseCase;
  let orderDao: Partial<OrderDao>;
  let activityLogService: Partial<ActivityLogService>;

  const createFreshOrder = (status: OrderStatus = OrderStatus.CREATED) =>
    new Order({
      id: 1,
      orderNumber: 'PED-0001',
      quoteId: 10,
      clientId: 5,
      status,
      subtotal: 300,
      total: 300,
      items: [],
    });

  beforeEach(() => {
    orderDao = {
      findById: vi.fn().mockImplementation(async () => createFreshOrder()),
      save: vi.fn().mockImplementation(async (order: Order) => order),
    };

    activityLogService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ChangeOrderStatusUseCase(
      orderDao as OrderDao,
      activityLogService as ActivityLogService,
    );
  });

  it('changes order status from CREATED to DISPATCHED and logs activity', async () => {
    const result = await useCase.execute({
      orderId: 1,
      newStatus: OrderStatus.DISPATCHED,
      actorId: 2,
    });

    expect(result.status).toBe(OrderStatus.DISPATCHED);
    expect(orderDao.save).toHaveBeenCalled();
    expect(activityLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.status_changed',
        entityType: 'order',
        actorId: 2,
        metadata: {
          orderNumber: 'PED-0001',
          previousStatus: OrderStatus.CREATED,
          newStatus: OrderStatus.DISPATCHED,
        },
      }),
    );
  });

  it('looks the order up within the actor scope (HU-06)', async () => {
    await useCase.execute({
      orderId: 1,
      newStatus: OrderStatus.DISPATCHED,
      actorId: 2,
      actor: { id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 4 },
    });

    expect(orderDao.findById).toHaveBeenCalledWith(1, { zoneId: 4 });
  });

  it('throws OrderNotFoundError when order does not exist', async () => {
    vi.mocked(orderDao.findById!).mockResolvedValue(null);

    await expect(
      useCase.execute({
        orderId: 99,
        newStatus: OrderStatus.DISPATCHED,
        actorId: 5,
      }),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('throws InvalidOrderStatusTransitionError when invalid transition is attempted', async () => {
    await expect(
      useCase.execute({
        orderId: 1,
        newStatus: OrderStatus.DELIVERED,
        actorId: 5,
      }),
    ).rejects.toThrow(InvalidOrderStatusTransitionError);
  });
});
