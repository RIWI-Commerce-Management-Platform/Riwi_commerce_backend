import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RecordClientActivityUseCase } from './record-client-activity.use-case.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { Client } from '../domain/client.entity.js';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

describe('RecordClientActivityUseCase', () => {
  let clientRepo: ClientRepository;
  let historyRepo: ClientHistoryRepository;
  let useCase: RecordClientActivityUseCase;

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
      save: vi.fn(async (h: ClientHistory) => h),
      findByClientId: vi.fn(),
      findRecent: vi.fn(),
      findById: vi.fn(),
    };

    useCase = new RecordClientActivityUseCase(clientRepo, historyRepo);
  });

  it('should throw ClientNotFoundError when the client does not exist', async () => {
    vi.mocked(clientRepo.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        clientId: 999,
        action: 'note.added',
        description: 'Customer requested a callback',
      }),
    ).rejects.toThrow(ClientNotFoundError);
  });

  it('should successfully record and return client history entry', async () => {
    vi.mocked(clientRepo.findById).mockResolvedValueOnce(mockClient);

    const result = await useCase.execute({
      clientId: 10,
      action: 'note.added',
      description: 'Customer requested a callback',
      userId: 'usr-123',
      entityType: 'note',
      entityId: 1,
      metadata: { urgent: true },
    });

    expect(result.clientId).toBe(10);
    expect(result.action).toBe('note.added');
    expect(result.description).toBe('Customer requested a callback');
    expect(result.userId).toBe('usr-123');
    expect(result.entityType).toBe('note');
    expect(result.entityId).toBe('1');
    expect(result.metadata).toEqual({ urgent: true });
    expect(historyRepo.save).toHaveBeenCalledTimes(1);
  });
});
