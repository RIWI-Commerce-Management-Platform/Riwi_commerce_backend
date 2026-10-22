import { describe, expect, it, vi } from 'vitest';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeOrmClientHistoryRepository } from './typeorm-client-history.repository.js';
import { ClientHistoryOrmEntity } from './client-history.orm-entity.js';
import { ClientHistory } from '../domain/client-history.entity.js';

describe('TypeOrmClientHistoryRepository', () => {
  const createMockOrm = (): ClientHistoryOrmEntity => {
    const orm = new ClientHistoryOrmEntity();
    orm.id = 1;
    orm.clientId = 10;
    orm.userId = 'usr-1';
    orm.action = 'visit.started';
    orm.description = 'Visit #1 started';
    orm.entityType = 'visit';
    orm.entityId = '1';
    orm.metadata = { key: 'val' };
    orm.createdAt = new Date('2026-10-22T08:00:00Z');
    return orm;
  };

  it('save should persist and return domain entity', async () => {
    const orm = createMockOrm();
    const saveMock = vi.fn().mockResolvedValueOnce(orm);
    const mockRepo = { save: saveMock } as unknown as Repository<ClientHistoryOrmEntity>;

    const repository = new TypeOrmClientHistoryRepository(mockRepo);
    const domain = new ClientHistory({
      clientId: 10,
      action: 'visit.started',
      description: 'Visit #1 started',
      userId: 'usr-1',
      entityType: 'visit',
      entityId: 1,
    });

    const result = await repository.save(domain);

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(1);
    expect(result.action).toBe('visit.started');
  });

  it('findById should return domain entity when found', async () => {
    const orm = createMockOrm();
    const findOneMock = vi.fn().mockResolvedValueOnce(orm);
    const mockRepo = { findOne: findOneMock } as unknown as Repository<ClientHistoryOrmEntity>;

    const repository = new TypeOrmClientHistoryRepository(mockRepo);
    const result = await repository.findById(1);

    expect(findOneMock).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result?.id).toBe(1);
    expect(result?.clientId).toBe(10);
  });

  it('findById should return null when not found', async () => {
    const findOneMock = vi.fn().mockResolvedValueOnce(null);
    const mockRepo = { findOne: findOneMock } as unknown as Repository<ClientHistoryOrmEntity>;

    const repository = new TypeOrmClientHistoryRepository(mockRepo);
    const result = await repository.findById(999);

    expect(findOneMock).toHaveBeenCalledWith({ where: { id: 999 } });
    expect(result).toBeNull();
  });

  it('findByClientId should build query and return paginated result', async () => {
    const orm = createMockOrm();
    const qb = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValueOnce([[orm], 1]),
    } as unknown as SelectQueryBuilder<ClientHistoryOrmEntity>;

    const createQueryBuilderMock = vi.fn().mockReturnValue(qb);
    const mockRepo = {
      createQueryBuilder: createQueryBuilderMock,
    } as unknown as Repository<ClientHistoryOrmEntity>;

    const repository = new TypeOrmClientHistoryRepository(mockRepo);
    const result = await repository.findByClientId(10, {
      page: 1,
      limit: 10,
      action: 'visit.started',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
  });

  it('findRecent should return most recent entries', async () => {
    const orm = createMockOrm();
    const findMock = vi.fn().mockResolvedValueOnce([orm]);
    const mockRepo = { find: findMock } as unknown as Repository<ClientHistoryOrmEntity>;

    const repository = new TypeOrmClientHistoryRepository(mockRepo);
    const result = await repository.findRecent(5);

    expect(findMock).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 5,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
