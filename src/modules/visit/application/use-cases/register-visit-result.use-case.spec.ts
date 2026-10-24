import { describe, expect, it, vi, beforeEach } from 'vitest';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { RegisterVisitResultUseCase } from './register-visit-result.use-case.js';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { VisitResultCatalogDao } from '../../domain/dao/visit-result-catalog.dao.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { VisitResultOption } from '../../domain/visit-result.entity.js';

import { ActivityLogService } from '../../../../shared/activity-log/domain/activity-log.service.js';

function buildVisit(status: VisitStatus = VisitStatus.IN_PROGRESS) {
  return new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
    actualDate: new Date(2026, 9, 20),
    startTime: '09:00:00',
    endTime: null,
    status,
    objective: 'Present the catalog',
  });
}

describe('RegisterVisitResultUseCase', () => {
  let useCase: RegisterVisitResultUseCase;
  let mockVisitDao: Partial<VisitDao>;
  let mockCatalogDao: Partial<VisitResultCatalogDao>;
  let mockActivityLog: Partial<ActivityLogService>;

  beforeEach(() => {
    mockVisitDao = {
      findByIdAndAdvisor: vi.fn(),
      save: vi
        .fn()
        .mockImplementation((visit: Visit) => Promise.resolve(visit)),
    };
    mockCatalogDao = {
      findByIds: vi.fn().mockResolvedValue([
        new VisitResultOption({
          id: 1,
          name: 'Visita realizada',
          isActive: true,
        }),
        new VisitResultOption({
          id: 2,
          name: 'Pedido capturado',
          isActive: true,
        }),
      ]),
    };
    mockActivityLog = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new RegisterVisitResultUseCase(
      mockVisitDao as VisitDao,
      mockCatalogDao as VisitResultCatalogDao,
      mockActivityLog as ActivityLogService,
    );
  });

  it('registers a result and moves the visit to VISITED', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());

    const result = await useCase.execute(1, 20, {
      endTime: '10:30:00',
      observations: 'Cliente interesado en el contrato anual.',
      results: [{ id: 1 }],
    });

    expect(result.status).toBe(VisitStatus.VISITED);
    expect(result.endTime).toBe('10:30:00');
    expect(result.observations).toBe(
      'Cliente interesado en el contrato anual.',
    );
    expect(result.results).toEqual([
      { id: 1, name: 'Visita realizada', observation: undefined },
    ]);
  });

  it('persists multiple selected results resolved against the catalog', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());

    await useCase.execute(1, 20, {
      endTime: '10:30:00',
      observations: 'obs',
      results: [{ id: 1 }, { id: 2, observation: 'Descuento del 10%' }],
    });

    const saved = (mockVisitDao.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Visit;

    expect(saved.results).toHaveLength(2);
    expect(saved.results.map((result) => result.id)).toEqual([1, 2]);
    expect(saved.results[1]).toEqual({
      id: 2,
      name: 'Pedido capturado',
      observation: 'Descuento del 10%',
    });
  });

  it('records the result registration in the activity log', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());

    await useCase.execute(1, 20, {
      endTime: '10:30:00',
      observations: 'obs',
      results: [{ id: 1 }, { id: 2 }],
    });

    expect(mockActivityLog.record).toHaveBeenCalledWith({
      action: 'visit.result_registered',
      entityType: 'visit',
      entityId: 1,
      actorId: 20,
      metadata: { clientId: 10, resultIds: [1, 2] },
    });
  });

  it('throws NotFound when the visit does not exist or belongs to another advisor', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1 }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an empty results list without querying the catalog', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'obs',
        results: [],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(mockCatalogDao.findByIds).not.toHaveBeenCalled();
    expect(mockVisitDao.save).not.toHaveBeenCalled();
  });

  it('rejects result ids that do not exist or are inactive in the catalog', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1 }, { id: 999 }],
      }),
    ).rejects.toThrow('Invalid or inactive visit result ids: 999.');
    expect(mockVisitDao.save).not.toHaveBeenCalled();
    expect(mockActivityLog.record).not.toHaveBeenCalled();
  });

  it('rejects registering a result on a visit that is not in progress', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit(VisitStatus.PENDING));

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(mockVisitDao.save).not.toHaveBeenCalled();
  });

  it('rejects observations longer than 500 characters', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'x'.repeat(501),
        results: [{ id: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(mockVisitDao.save).not.toHaveBeenCalled();
  });

  it('propagates persistence errors instead of masking them as bad requests', async () => {
    (
      mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>
    ).mockResolvedValue(buildVisit());
    (mockVisitDao.save as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1 }],
      }),
    ).rejects.toThrow('database unavailable');
    expect(mockActivityLog.record).not.toHaveBeenCalled();
  });

  it('rethrows unexpected error thrown inside registerResult', async () => {
    const visit = buildVisit();
    vi.spyOn(visit, 'registerResult').mockImplementation(() => {
      throw new Error('Unexpected domain error');
    });
    (mockVisitDao.findByIdAndAdvisor as any).mockResolvedValue(visit);

    await expect(
      useCase.execute(1, 20, {
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1 }],
      }),
    ).rejects.toThrow('Unexpected domain error');
  });
});
