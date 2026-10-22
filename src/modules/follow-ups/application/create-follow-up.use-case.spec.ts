import { describe, expect, it, vi } from 'vitest';

import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { FollowUp } from '../domain/follow-up.entity.js';
import { FollowUpDao } from '../domain/dao/follow-up.dao.js';
import { CreateFollowUpUseCase } from './create-follow-up.use-case.js';

describe('CreateFollowUpUseCase', () => {
  it('creates a follow-up for an existing visit owned by the advisor', async () => {
    const mockRepo: Partial<FollowUpDao> = {
      create: vi.fn().mockImplementation(async (input) => input),
      findByVisitAndAdvisor: vi.fn().mockResolvedValue([]),
    };

    const mockActivityLog: Partial<ActivityLogService> = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new CreateFollowUpUseCase(
      mockRepo as FollowUpDao,
      mockActivityLog as ActivityLogService,
      {
        findByIdAndAdvisor: vi
          .fn()
          .mockResolvedValue({ id: 10, advisorId: 7, clientId: 31 }),
      } as any,
    );

    const result = await useCase.execute(10, 7, {
      nextDate: '2026-10-25',
      activity: 'Llamar para confirmar reunión',
      observation: 'Cliente pendiente de respuesta',
    });

    expect(result.visitId).toBe(10);
    expect(result.responsibleAdvisorId).toBe(7);
    expect(result.completed).toBe(false);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockActivityLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'follow_up.created',
        clientId: 31,
      }),
    );
  });
});

describe('CompleteFollowUpUseCase', () => {
  it('marks a follow-up as completed', async () => {
    const followUp = new FollowUp({
      id: 2,
      visitId: 10,
      nextDate: new Date('2026-10-25T00:00:00.000Z'),
      activity: 'Enviar propuesta',
      observation: 'Confirmar envío por correo',
      responsibleAdvisorId: 7,
      completed: false,
    });

    const mockRepo: Partial<FollowUpDao> = {
      findByIdAndAdvisor: vi.fn().mockResolvedValue(followUp),
      save: vi.fn().mockImplementation(async (input) => input),
    };

    const mockActivityLog: Partial<ActivityLogService> = {
      record: vi.fn().mockResolvedValue(undefined),
    };
    const mockVisitDao = {
      findByIdAndAdvisor: vi
        .fn()
        .mockResolvedValue({ id: 10, clientId: 31, advisorId: 7 }),
    };

    const useCase = await import('./complete-follow-up.use-case.js');
    const instance = new useCase.CompleteFollowUpUseCase(
      mockRepo as FollowUpDao,
      mockActivityLog as ActivityLogService,
      mockVisitDao as any,
    );

    const result = await instance.execute(2, 7);

    expect(result.completed).toBe(true);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockActivityLog.record).toHaveBeenCalledWith({
      action: 'follow_up.completed',
      entityType: 'follow_up',
      entityId: 2,
      actorId: 7,
      clientId: 31,
      metadata: { visitId: 10, completed: true },
    });
  });
});
