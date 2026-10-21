import { describe, expect, it, vi, beforeEach } from 'vitest';

import { NotFoundException } from '@nestjs/common';

import { GetVisitByIdUseCase } from './get-visit-by-id.use-case.js';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { ClientReader } from '../../../../shared/clients/domain/client-reader.js';

function buildVisit() {
  return new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
    actualDate: null,
    startTime: null,
    endTime: null,
    status: VisitStatus.PENDING,
    objective: 'Presentar catalogo',
  });
}

describe('GetVisitByIdUseCase', () => {
  let useCase: GetVisitByIdUseCase;
  let mockVisitDao: Partial<VisitDao>;
  let mockClientReader: Partial<ClientReader>;

  beforeEach(() => {
    mockVisitDao = {
      findByIdAndAdvisor: vi.fn(),
    };
    mockClientReader = {
      findById: vi.fn().mockResolvedValue(null),
    };

    useCase = new GetVisitByIdUseCase(
      mockVisitDao as VisitDao,
      mockClientReader as ClientReader,
    );
  });

  it('returns the visit when the advisor owns it', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );

    const result = await useCase.execute(1, 20);

    expect(result.id).toBe(1);
    expect(mockVisitDao.findByIdAndAdvisor).toHaveBeenCalledWith(1, 20);
  });

  it('throws NotFound when the visit does not exist', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(useCase.execute(999, 20)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when the visit belongs to another advisor', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(useCase.execute(1, 999)).rejects.toThrow(NotFoundException);
    expect(mockVisitDao.findByIdAndAdvisor).toHaveBeenCalledWith(1, 999);
  });

  it('enriches the visit with client details when the client contract returns data', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );
    (mockClientReader.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      name: 'Distribuciones Andina',
      contactName: 'Maria Perez',
      potential: 'ALTO',
    });

    const result = await useCase.execute(1, 20);

    expect(result.clientName).toBe('Distribuciones Andina');
    expect(result.contactName).toBe('Maria Perez');
    expect(result.clientPotential).toBe('ALTO');
  });

  it('keeps client fields empty when the client contract is not available yet', async () => {
    (mockVisitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );
    (mockClientReader.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.execute(1, 20);

    expect(result.clientName).toBeUndefined();
    expect(result.contactName).toBeUndefined();
    expect(result.clientPotential).toBeUndefined();
  });
});
