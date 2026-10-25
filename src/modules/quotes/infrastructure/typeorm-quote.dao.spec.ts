import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { TypeOrmQuoteDao } from './typeorm-quote.dao.js';
import { QuoteOrmEntity } from './quote.orm-entity.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';

describe('TypeOrmQuoteDao (Infrastructure)', () => {
  let dao: TypeOrmQuoteDao;
  let ormRepo: Partial<Repository<QuoteOrmEntity>>;

  const mockOrmEntity = {
    id: 1,
    quoteNumber: 'COT-0001',
    clientId: 5,
    status: 'DRAFT',
    subtotal: 100,
    total: 100,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as QuoteOrmEntity;

  beforeEach(() => {
    ormRepo = {
      save: vi.fn().mockResolvedValue(mockOrmEntity),
      findOne: vi.fn().mockResolvedValue(mockOrmEntity),
      find: vi.fn().mockResolvedValue([mockOrmEntity]),
      count: vi.fn().mockResolvedValue(1),
      query: vi.fn().mockResolvedValue([{ nextval: '1' }]),
    };

    dao = new TypeOrmQuoteDao(ormRepo as Repository<QuoteOrmEntity>);
  });

  it('saves a quote entity', async () => {
    const quote = new Quote({
      id: 1,
      quoteNumber: 'COT-0001',
      clientId: 5,
      status: QuoteStatus.DRAFT,
      subtotal: 100,
      total: 100,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await dao.save(quote);
    expect(result.id).toBe(1);
    expect(ormRepo.save).toHaveBeenCalled();
  });

  it('finds quote by ID when it exists', async () => {
    const result = await dao.findById(1);
    expect(result).not.toBeNull();
    expect(result?.quoteNumber).toBe('COT-0001');
  });

  it('returns null when quote is not found by ID', async () => {
    vi.mocked(ormRepo.findOne!).mockResolvedValue(null);
    const result = await dao.findById(999);
    expect(result).toBeNull();
  });

  it('finds quote by quote number when it exists', async () => {
    const result = await dao.findByQuoteNumber('COT-0001');
    expect(result).not.toBeNull();
    expect(result?.quoteNumber).toBe('COT-0001');
  });

  it('returns null when quote is not found by quote number', async () => {
    vi.mocked(ormRepo.findOne!).mockResolvedValue(null);
    const result = await dao.findByQuoteNumber('COT-9999');
    expect(result).toBeNull();
  });

  describe('generateNextQuoteNumber', () => {
    it('uses sequence when available', async () => {
      vi.mocked(ormRepo.query!).mockResolvedValue([{ nextval: '5' }]);
      const nextNum = await dao.generateNextQuoteNumber();
      expect(nextNum).toBe('COT-0005');
    });

    it('falls back to COT-0001 when query fails and no records exist', async () => {
      vi.mocked(ormRepo.query!).mockRejectedValue(
        new Error('Sequence missing'),
      );
      vi.mocked(ormRepo.find!).mockResolvedValue([]);

      const nextNum = await dao.generateNextQuoteNumber();
      expect(nextNum).toBe('COT-0001');
    });

    it('falls back to regex parsing when latest quote exists', async () => {
      vi.mocked(ormRepo.query!).mockRejectedValue(
        new Error('Sequence missing'),
      );
      vi.mocked(ormRepo.find!).mockResolvedValue([
        { quoteNumber: 'COT-0015' } as QuoteOrmEntity,
      ]);

      const nextNum = await dao.generateNextQuoteNumber();
      expect(nextNum).toBe('COT-0016');
    });

    it('falls back to count when regex does not match', async () => {
      vi.mocked(ormRepo.query!).mockRejectedValue(
        new Error('Sequence missing'),
      );
      vi.mocked(ormRepo.find!).mockResolvedValue([
        { quoteNumber: 'CUSTOM-QUOTE' } as QuoteOrmEntity,
      ]);
      vi.mocked(ormRepo.count!).mockResolvedValue(4);

      const nextNum = await dao.generateNextQuoteNumber();
      expect(nextNum).toBe('COT-0005');
    });
  });

  describe('findPaginated', () => {
    it('queries paginated quotes with all filters applied', async () => {
      const qbMock: any = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockOrmEntity], 1]),
      };
      ormRepo.createQueryBuilder = vi.fn().mockReturnValue(qbMock);

      const result = await dao.findPaginated({
        clientId: 5,
        status: 'DRAFT',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'quote.clientId = :clientId',
        {
          clientId: 5,
        },
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith('quote.status = :status', {
        status: 'DRAFT',
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

      const result = await dao.findPaginated({
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

describe('TypeOrmQuoteDao.findById with an actor scope', () => {
  const build = (found: unknown) => {
    const query: any = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(found),
    };
    const ormRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue(query),
    };
    return {
      dao: new TypeOrmQuoteDao(
        ormRepo as unknown as Repository<QuoteOrmEntity>,
      ),
      ormRepo,
      query,
    };
  };

  it('filters by advisor when the actor is an advisor', async () => {
    const { dao, ormRepo, query } = build(null);

    const result = await dao.findById(1, { advisorId: 7 });

    expect(result).toBeNull();
    expect(ormRepo.findOne).not.toHaveBeenCalled();
    expect(query.where).toHaveBeenCalledWith('quote.id = :id', { id: 1 });
    expect(query.andWhere).toHaveBeenCalledWith(
      'quote.advisorId = :advisorId',
      {
        advisorId: 7,
      },
    );
  });

  it('joins the client zone when the actor is a regional director', async () => {
    const { dao, query } = build(null);

    await dao.findById(1, { zoneId: 3 });

    expect(query.innerJoin).toHaveBeenCalledWith(
      'quote.client',
      'quote_client',
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      'quote_client.zoneId = :zoneId',
      {
        zoneId: 3,
      },
    );
  });
});
