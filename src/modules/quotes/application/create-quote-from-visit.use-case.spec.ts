import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { Visit, VisitStatus } from '../../visit/domain/visit.entity.js';
import { CreateQuoteUseCase } from './create-quote.use-case.js';
import { CreateQuoteFromVisitUseCase } from './create-quote-from-visit.use-case.js';

function buildVisit() {
  return new Visit({
    id: 45,
    clientId: 12,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date('2026-10-20T09:00:00.000Z'),
    actualDate: null,
    startTime: null,
    endTime: null,
    status: VisitStatus.PENDING,
    objective: 'Present catalog',
  });
}

describe('CreateQuoteFromVisitUseCase', () => {
  let useCase: CreateQuoteFromVisitUseCase;
  let visitDao: Partial<VisitDao>;
  let createQuote: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    visitDao = { findByIdAndAdvisor: vi.fn() };
    createQuote = {
      execute: vi.fn().mockResolvedValue({ id: 1, clientId: 12 }),
    };
    useCase = new CreateQuoteFromVisitUseCase(
      visitDao as VisitDao,
      createQuote as unknown as CreateQuoteUseCase,
    );
  });

  it('creates the quote through E5 with the visit client and advisor scope', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildVisit(),
    );
    const command = {
      notes: 'Prepared during the visit',
      items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
    };

    await useCase.execute(45, 20, command);

    expect(visitDao.findByIdAndAdvisor).toHaveBeenCalledWith(45, 20);
    expect(createQuote.execute).toHaveBeenCalledWith({
      ...command,
      clientId: 12,
    });
  });

  it('does not create a quote if the visit is missing or belongs to another advisor', async () => {
    (visitDao.findByIdAndAdvisor as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute(45, 20, {
        items: [{ productName: 'Product', quantity: 1, unitPrice: 25 }],
      }),
    ).rejects.toThrow(NotFoundException);

    expect(createQuote.execute).not.toHaveBeenCalled();
  });
});
