import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { FindOperator, Repository } from 'typeorm';

import { TypeOrmVisitDao } from './typeorm-visit.dao.js';

import { VisitOrmEntity } from '../visit.orm-entity.js';

import { VisitResultLinkOrmEntity } from '../visit-result-link.orm-entity.js';

import { VisitResultOptionOrmEntity } from '../visit-result-option.orm-entity.js';

import { VisitStatus } from '../../domain/visit.entity.js';

type MockRepository = {
  find: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  manager: { transaction: ReturnType<typeof vi.fn> };
};

function buildVisitEntity(overrides: Partial<VisitOrmEntity> = {}): VisitOrmEntity {
  const entity = new VisitOrmEntity();
  entity.id = 1;
  entity.clientId = 10;
  entity.advisorId = 20;
  entity.routeId = null;
  entity.scheduledAt = new Date(2026, 9, 20, 9, 0, 0);
  entity.actualDate = new Date(2026, 9, 20);
  entity.startTime = '09:00:00';
  entity.endTime = '10:30:00';
  entity.status = VisitStatus.VISITED;
  entity.objective = 'Presentar catalogo';
  entity.observations = 'obs';
  Object.assign(entity, overrides);
  return entity;
}

function buildLink(resultId: number, observation: string | null = null) {
  const link = new VisitResultLinkOrmEntity();
  link.id = resultId;
  link.visitId = 1;
  link.resultId = resultId;
  link.observation = observation;
  link.createdAt = new Date();
  return link;
}

function buildOption(id: number, name: string) {
  const option = new VisitResultOptionOrmEntity();
  option.id = id;
  option.name = name;
  option.isActive = true;
  return option;
}

describe('TypeOrmVisitDao', () => {
  let dao: TypeOrmVisitDao;
  let mockRepository: MockRepository;
  let mockLinkRepository: MockRepository;
  let mockOptionRepository: MockRepository;
  let mockManager: { transaction: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockManager = { transaction: vi.fn() };
    mockRepository = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
      delete: vi.fn(),
      manager: mockManager,
    };
    mockLinkRepository = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      manager: mockManager,
    };
    mockOptionRepository = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      manager: mockManager,
    };

    dao = new TypeOrmVisitDao(
      mockRepository as unknown as Repository<VisitOrmEntity>,
      mockLinkRepository as unknown as Repository<VisitResultLinkOrmEntity>,
      mockOptionRepository as unknown as Repository<VisitResultOptionOrmEntity>,
    );
  });

  it('orders the agenda by scheduled date and time ascending', async () => {
    const startDate = new Date(2026, 9, 20, 0, 0, 0, 0);
    const endDate = new Date(2026, 9, 20, 23, 59, 59, 999);

    await dao.findAgenda({ advisorId: 20, startDate, endDate });

    expect(mockRepository.find).toHaveBeenCalledTimes(1);

    const options = mockRepository.find.mock.calls[0][0];

    expect(options.order).toEqual({ scheduledAt: 'ASC' });
    expect(options.where.advisorId).toBe(20);

    const scheduledAt = options.where.scheduledAt as FindOperator<unknown>;

    expect(scheduledAt.type).toBe('between');
    expect(scheduledAt.value).toEqual([startDate, endDate]);
  });

  it('queries agenda visits restricted to the given advisor', async () => {
    await dao.findAgenda({
      advisorId: 42,
      startDate: new Date(2026, 9, 20),
      endDate: new Date(2026, 9, 21),
    });

    const options = mockRepository.find.mock.calls[0][0];

    expect(options.where.advisorId).toBe(42);
  });

  it('returns null when the visit does not exist or belongs to another advisor', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    const result = await dao.findByIdAndAdvisor(1, 999);

    expect(result).toBeNull();
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, advisorId: 999 },
    });
  });

  it('loads result links and catalog names explicitly (no ORM relations)', async () => {
    mockRepository.findOne.mockResolvedValue(buildVisitEntity());
    mockLinkRepository.find.mockResolvedValue([
      buildLink(1),
      buildLink(2, 'Con seguimiento'),
    ]);
    mockOptionRepository.find.mockResolvedValue([
      buildOption(1, 'Visita realizada'),
      buildOption(2, 'Pedido capturado'),
    ]);

    const result = await dao.findByIdAndAdvisor(1, 20);

    expect(result?.results).toEqual([
      { id: 1, name: 'Visita realizada', observation: undefined },
      { id: 2, name: 'Pedido capturado', observation: 'Con seguimiento' },
    ]);
    expect(mockLinkRepository.find).toHaveBeenCalledWith({ where: { visitId: 1 } });
    expect(mockOptionRepository.find).toHaveBeenCalledTimes(1);
  });

  it('returns an empty results list when the visit has no links', async () => {
    mockRepository.findOne.mockResolvedValue(buildVisitEntity());
    mockLinkRepository.find.mockResolvedValue([]);

    const result = await dao.findByIdAndAdvisor(1, 20);

    expect(result?.results).toEqual([]);
    expect(mockOptionRepository.find).not.toHaveBeenCalled();
  });
});
