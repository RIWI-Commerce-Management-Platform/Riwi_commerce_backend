import { describe, expect, it, vi, beforeEach } from 'vitest';

import { VisitsController } from './visit.controller.js';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { CurrentAdvisorProvider } from '../../../../shared/auth/domain/current-advisor.provider.js';

import { VisitSummaryResponseDto } from '../dtos/visit-summary-response.dto.js';

import { VisitDetailResponseDto } from '../dtos/visit-detail-response.dto.js';
import type { CurrentAdvisorRequest } from '../../../../shared/auth/domain/current-advisor.provider.js';
import type { UserOrmEntity } from '../../../auth/infrastructure/user.orm-entity.js';

function buildVisit(status: VisitStatus = VisitStatus.PENDING) {
  return new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
    actualDate: null,
    startTime: null,
    endTime: null,
    status,
    objective: 'Presentar catalogo',
  });
}

function buildRequest(): CurrentAdvisorRequest {
  return { user: { role: 'ASESOR', idAsesor: 20 } };
}

describe('VisitsController', () => {
  let controller: VisitsController;
  let mockGetAgenda: { execute: ReturnType<typeof vi.fn> };
  let mockGetById: { execute: ReturnType<typeof vi.fn> };
  let mockStart: { execute: ReturnType<typeof vi.fn> };
  let mockRegisterResult: { execute: ReturnType<typeof vi.fn> };
  let mockCurrentAdvisor: { extract: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockGetAgenda = { execute: vi.fn().mockResolvedValue([buildVisit()]) };
    mockGetById = { execute: vi.fn().mockResolvedValue(buildVisit()) };
    mockStart = {
      execute: vi
        .fn()
        .mockResolvedValue(buildVisit(VisitStatus.IN_PROGRESS)),
    };
    mockRegisterResult = {
      execute: vi.fn().mockResolvedValue(buildVisit(VisitStatus.VISITED)),
    };
    mockCurrentAdvisor = { extract: vi.fn().mockResolvedValue(20) };

    controller = new VisitsController(
      mockGetAgenda as unknown as GetVisitAgendaUseCase,
      mockGetById as unknown as GetVisitByIdUseCase,
      mockStart as unknown as StartVisitUseCase,
      mockRegisterResult as unknown as RegisterVisitResultUseCase,
      mockCurrentAdvisor as unknown as CurrentAdvisorProvider,
    );
  });

  it('returns agenda summaries for the authenticated advisor', async () => {
    const result = await controller.getAgenda(buildRequest(), {
      period: 'day',
      date: '2026-10-20',
    });

    expect(mockCurrentAdvisor.extract).toHaveBeenCalledTimes(1);
    expect(mockGetAgenda.execute).toHaveBeenCalledWith(20, 'day', '2026-10-20');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(VisitSummaryResponseDto);
    expect(result[0].status).toBe(VisitStatus.PENDING);
  });

  it('returns visit details as a response dto', async () => {
    const result = await controller.getById(1, buildRequest());

    expect(mockGetById.execute).toHaveBeenCalledWith(1, 20);
    expect(result).toBeInstanceOf(VisitDetailResponseDto);
  });

  it('starts a visit through the use case', async () => {
    const result = await controller.start(1, buildRequest(), {
      id: 'user-20',
      idAsesor: 20,
    } as UserOrmEntity);

    expect(mockStart.execute).toHaveBeenCalledWith(1, 20, 20);
    expect(result.status).toBe(VisitStatus.IN_PROGRESS);
  });

  it('registers a visit result through the use case', async () => {
    const result = await controller.registerResult(1, buildRequest(), {
      endTime: '10:30:00',
      observations: 'obs',
      results: [{ id: 1 }],
    }, {
      id: 'user-20',
      idAsesor: 20,
    } as UserOrmEntity);

    expect(mockRegisterResult.execute).toHaveBeenCalledWith(
      1,
      20,
      {
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1 }],
      },
      20,
    );
    expect(result).toBeInstanceOf(VisitDetailResponseDto);
  });
});
