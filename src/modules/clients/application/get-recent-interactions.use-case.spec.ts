import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GetRecentInteractionsUseCase } from './get-recent-interactions.use-case.js';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { ClientHistory } from '../domain/client-history.entity.js';

describe('GetRecentInteractionsUseCase', () => {
  let historyRepo: ClientHistoryRepository;
  let useCase: GetRecentInteractionsUseCase;

  beforeEach(() => {
    historyRepo = {
      save: vi.fn(),
      findByClientId: vi.fn(),
      findRecent: vi.fn(),
      findById: vi.fn(),
    };

    useCase = new GetRecentInteractionsUseCase(historyRepo);
  });

  it('should return recent interactions', async () => {
    const mockItems = [
      new ClientHistory({
        id: 2,
        clientId: 10,
        action: 'visit.result_registered',
        description: 'Visit completed',
      }),
      new ClientHistory({
        id: 1,
        clientId: 5,
        action: 'quote.created',
        description: 'Quote #4 created',
      }),
    ];

    vi.mocked(historyRepo.findRecent).mockResolvedValueOnce(mockItems);

    const result = await useCase.execute(5);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2);
    expect(historyRepo.findRecent).toHaveBeenCalledWith(5);
  });
});
