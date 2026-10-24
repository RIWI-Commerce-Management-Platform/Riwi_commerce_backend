import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { TypeOrmOrderRepository } from './typeorm-order.repository.js';
import { OrderOrmEntity } from './order.orm-entity.js';
import { Order } from '../domain/order.entity.js';
import { OrderStatus } from '../domain/order-status.enum.js';

describe('TypeOrmOrderRepository (Infrastructure)', () => {
  let repository: TypeOrmOrderRepository;
  let ormRepo: Partial<Repository<OrderOrmEntity>>;

  const mockOrmEntity = {
    id: 1,
    orderNumber: 'PED-0001',
    quoteId: 10,
    clientId: 5,
    status: 'CREATED',
    subtotal: 100,
    total: 100,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as OrderOrmEntity;

  beforeEach(() => {
    ormRepo = {
      save: vi.fn().mockResolvedValue(mockOrmEntity),
      findOne: vi.fn().mockResolvedValue(mockOrmEntity),
      find: vi.fn().mockResolvedValue([mockOrmEntity]),
      count: vi.fn().mockResolvedValue(1),
      query: vi.fn().mockResolvedValue([{ nextval: '1' }]),
    };

    repository = new TypeOrmOrderRepository(
      ormRepo as Repository<OrderOrmEntity>,
    );
  });

  it('saves an order entity', async () => {
    const order = new Order({
      id: 1,
      orderNumber: 'PED-0001',
      quoteId: 10,
      clientId: 5,
      status: OrderStatus.CREATED,
      subtotal: 100,
      total: 100,
      items: [],
    });

    const result = await repository.save(order);
    expect(result.id).toBe(1);
    expect(ormRepo.save).toHaveBeenCalled();
  });

  it('finds order by ID when it exists', async () => {
    const result = await repository.findById(1);
    expect(result).not.toBeNull();
    expect(result?.orderNumber).toBe('PED-0001');
  });

  it('returns null when order is not found by ID', async () => {
    vi.mocked(ormRepo.findOne!).mockResolvedValue(null);
    const result = await repository.findById(999);
    expect(result).toBeNull();
  });

  it('finds order by quote ID when it exists', async () => {
    const result = await repository.findByQuoteId(10);
    expect(result).not.toBeNull();
    expect(result?.quoteId).toBe(10);
  });

  it('returns null when order is not found by quote ID', async () => {
    vi.mocked(ormRepo.findOne!).mockResolvedValue(null);
    const result = await repository.findByQuoteId(999);
    expect(result).toBeNull();
  });

  it('finds order by order number when it exists', async () => {
    const result = await repository.findByOrderNumber('PED-0001');
    expect(result).not.toBeNull();
    expect(result?.orderNumber).toBe('PED-0001');
  });

  it('returns null when order is not found by order number', async () => {
    vi.mocked(ormRepo.findOne!).mockResolvedValue(null);
    const result = await repository.findByOrderNumber('PED-9999');
    expect(result).toBeNull();
  });

  describe('generateNextOrderNumber', () => {
    it('uses sequence when available', async () => {
      vi.mocked(ormRepo.query!).mockResolvedValue([{ nextval: '42' }]);
      const nextNum = await repository.generateNextOrderNumber();
      expect(nextNum).toBe('PED-0042');
    });

    it('falls back to PED-0001 when query fails and no records exist', async () => {
      vi.mocked(ormRepo.query!).mockRejectedValue(
        new Error('Sequence missing'),
      );
      vi.mocked(ormRepo.find!).mockResolvedValue([]);

      const nextNum = await repository.generateNextOrderNumber();
      expect(nextNum).toBe('PED-0001');
    });

    it('falls back to regex parsing when latest order exists', async () => {
      vi.mocked(ormRepo.query!).mockRejectedValue(
        new Error('Sequence missing'),
      );
      vi.mocked(ormRepo.find!).mockResolvedValue([
        { orderNumber: 'PED-0010' } as OrderOrmEntity,
      ]);

      const nextNum = await repository.generateNextOrderNumber();
      expect(nextNum).toBe('PED-0011');
    });

    it('falls back to count when regex does not match', async () => {
      vi.mocked(ormRepo.query!).mockRejectedValue(
        new Error('Sequence missing'),
      );
      vi.mocked(ormRepo.find!).mockResolvedValue([
        { orderNumber: 'CUSTOM-ORDER' } as OrderOrmEntity,
      ]);
      vi.mocked(ormRepo.count!).mockResolvedValue(3);

      const nextNum = await repository.generateNextOrderNumber();
      expect(nextNum).toBe('PED-0004');
    });
  });

  describe('findPaginated', () => {
    it('queries paginated orders with all filters applied', async () => {
      const qbMock: any = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockOrmEntity], 1]),
      };
      ormRepo.createQueryBuilder = vi.fn().mockReturnValue(qbMock);

      const result = await repository.findPaginated({
        clientId: 5,
        status: 'CREATED',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'order.clientId = :clientId',
        {
          clientId: 5,
        },
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith('order.status = :status', {
        status: 'CREATED',
      });
    });

    it('handles default page and limit fallbacks', async () => {
      const qbMock: any = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      };
      ormRepo.createQueryBuilder = vi.fn().mockReturnValue(qbMock);

      const result = await repository.findPaginated({
        page: -1,
        limit: 0,
      });

      expect(result.data).toHaveLength(0);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
