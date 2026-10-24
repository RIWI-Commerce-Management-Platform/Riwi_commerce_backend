import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeQuoteStatusUseCase } from './change-quote-status.use-case.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { Quote } from '../domain/quote.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { InvalidQuoteStatusTransitionError } from '../domain/errors/invalid-quote-status-transition.error.js';

describe('ChangeQuoteStatusUseCase', () => {
  let useCase: ChangeQuoteStatusUseCase;
  let quoteRepository: Partial<QuoteRepository>;
  let activityLogService: Partial<ActivityLogService>;

  const createQuote = (status: QuoteStatus = QuoteStatus.DRAFT) =>
    new Quote({
      id: 1,
      quoteNumber: 'COT-0001',
      clientId: 10,
      status,
      subtotal: 500,
      total: 500,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  beforeEach(() => {
    quoteRepository = {
      findById: vi.fn().mockResolvedValue(createQuote(QuoteStatus.DRAFT)),
      save: vi.fn().mockImplementation((q) => Promise.resolve(q)),
    };

    activityLogService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ChangeQuoteStatusUseCase(
      quoteRepository as QuoteRepository,
      activityLogService as ActivityLogService,
    );
  });

  it('successfully transitions from DRAFT to SENT and records activity log', async () => {
    const result = await useCase.execute({
      quoteId: 1,
      newStatus: QuoteStatus.SENT,
      actorId: 42,
    });

    expect(result.status).toBe(QuoteStatus.SENT);
    expect(quoteRepository.save).toHaveBeenCalled();
    expect(activityLogService.record).toHaveBeenCalledWith({
      action: 'quote.status_changed',
      entityType: 'quote',
      entityId: 1,
      actorId: 42,
      description: 'Quote COT-0001 status changed from DRAFT to SENT',
      metadata: {
        clientId: 10,
        quoteNumber: 'COT-0001',
        previousStatus: QuoteStatus.DRAFT,
        newStatus: QuoteStatus.SENT,
      },
    });
  });

  it('successfully transitions from SENT to APPROVED and records activity log', async () => {
    vi.mocked(quoteRepository.findById!).mockResolvedValue(
      createQuote(QuoteStatus.SENT),
    );

    const result = await useCase.execute({
      quoteId: 1,
      newStatus: QuoteStatus.APPROVED,
      actorId: 42,
    });

    expect(result.status).toBe(QuoteStatus.APPROVED);
    expect(activityLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Quote COT-0001 status changed from SENT to APPROVED',
        metadata: expect.objectContaining({
          previousStatus: QuoteStatus.SENT,
          newStatus: QuoteStatus.APPROVED,
        }),
      }),
    );
  });

  it('throws QuoteNotFoundError if quote does not exist', async () => {
    vi.mocked(quoteRepository.findById!).mockResolvedValue(null);

    await expect(
      useCase.execute({
        quoteId: 999,
        newStatus: QuoteStatus.SENT,
        actorId: 5,
      }),
    ).rejects.toThrow(QuoteNotFoundError);

    expect(quoteRepository.save).not.toHaveBeenCalled();
    expect(activityLogService.record).not.toHaveBeenCalled();
  });

  it('throws InvalidQuoteStatusTransitionError when invalid transition is attempted', async () => {
    vi.mocked(quoteRepository.findById!).mockResolvedValue(
      createQuote(QuoteStatus.APPROVED),
    );

    await expect(
      useCase.execute({
        quoteId: 1,
        newStatus: QuoteStatus.DRAFT,
        actorId: 5,
      }),
    ).rejects.toThrow(InvalidQuoteStatusTransitionError);

    expect(quoteRepository.save).not.toHaveBeenCalled();
    expect(activityLogService.record).not.toHaveBeenCalled();
  });
});
