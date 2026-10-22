import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GetClientHistoryUseCase } from './get-client-history.use-case.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { Client } from '../domain/client.entity.js';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

describe('GetClientHistoryUseCase', () => {
  let clientRepo: ClientRepository;
  let historyRepo: ClientHistoryRepository;
  let useCase: GetClientHistoryUseCase;

  const mockClient = new Client({
    id: 10,
    nit: '900123456-1',
    businessName: 'Distribuidora Los Andes S.A.S.',
    commercialName: 'Los Andes Market',
    address: 'Calle 50 # 45-20',
    department: 'Antioquia',
    municipality: 'Medellín',
    neighborhood: 'Laureles',
    phone: '+573001234567',
    email: 'contacto@losandes.com',
    zoneId: 1,
    clientTypeId: 1,
    potentialId: 1,
    clientStatusId: 1,
    visitFrequencyDays: 15,
    latitude: 6.2442,
    longitude: -75.5812,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    clientRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByNit: vi.fn(),
      findPaginated: vi.fn(),
    };

    historyRepo = {
      save: vi.fn(),
      findByClientId: vi.fn(),
      findRecent: vi.fn(),
      findById: vi.fn(),
    };

    useCase = new GetClientHistoryUseCase(clientRepo, historyRepo);
  });

  it('should throw ClientNotFoundError when client is not found', async () => {
    vi.mocked(clientRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(404)).rejects.toThrow(ClientNotFoundError);
  });

  it('should return paginated history when client exists', async () => {
    vi.mocked(clientRepo.findById).mockResolvedValueOnce(mockClient);

    const mockHistoryItem = new ClientHistory({
      id: 1,
      clientId: 10,
      action: 'visit.started',
      description: 'Visit #1 started',
      createdAt: new Date(),
    });

    const mockPaginated: PaginatedResult<ClientHistory> = {
      data: [mockHistoryItem],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    vi.mocked(historyRepo.findByClientId).mockResolvedValueOnce(mockPaginated);

    const result = await useCase.execute(10, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(1);
    expect(result.meta.total).toBe(1);
    expect(historyRepo.findByClientId).toHaveBeenCalledWith(10, { page: 1, limit: 10 });
  });
});
