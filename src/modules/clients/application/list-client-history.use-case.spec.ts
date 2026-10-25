import { describe, expect, it, vi } from 'vitest';
import { ListClientHistoryUseCase } from './list-client-history.use-case.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientHistoryDao } from '../domain/client-history.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

describe('ListClientHistoryUseCase', () => {
  const page = {
    data: [],
    meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
  };

  const setup = (client: unknown) => {
    const clientDao = { findById: vi.fn().mockResolvedValue(client) };
    const historyDao = { findByClientId: vi.fn().mockResolvedValue(page) };
    const useCase = new ListClientHistoryUseCase(
      clientDao as unknown as ClientDao,
      historyDao as unknown as ClientHistoryDao,
    );
    return { useCase, clientDao, historyDao };
  };

  it('returns the history page of an existing client', async () => {
    const { useCase, historyDao } = setup({ id: 1 });

    const result = await useCase.execute({ clientId: 1, page: 2, limit: 5 });

    expect(result).toBe(page);
    expect(historyDao.findByClientId).toHaveBeenCalledWith(1, 2, 5);
  });

  it('throws when the client does not exist', async () => {
    const { useCase, historyDao } = setup(null);

    await expect(
      useCase.execute({ clientId: 99, page: 1, limit: 10 }),
    ).rejects.toThrow(ClientNotFoundError);
    expect(historyDao.findByClientId).not.toHaveBeenCalled();
  });
});
