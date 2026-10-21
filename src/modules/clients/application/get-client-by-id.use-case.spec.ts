import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { GetClientByIdUseCase } from './get-client-by-id.use-case.js';

describe('GetClientByIdUseCase', () => {
  const save = vi.fn();
  const findById = vi.fn();
  const findByNit = vi.fn();
  const findPaginated = vi.fn();

  const mockRepository: ClientRepository = {
    save,
    findById,
    findByNit,
    findPaginated,
  };

  it('should return client when client exists', async () => {
    const dummyClient = new Client({
      id: 1,
      nit: '900123456-1',
      businessName: 'Distribuidora Los Andes S.A.S.',
      commercialName: 'Los Andes Market',
      address: 'Calle 50 # 45-20',
      department: 'Antioquia',
      municipality: 'Medellín',
      neighborhood: 'Laureles',
      phone: '+573001234567',
      email: 'contacto@losandes.com',
      zoneId: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb',
      clientTypeId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      potentialId: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
      clientStatusId: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
      visitFrequencyDays: 15,
      latitude: 6.2442,
      longitude: -75.5812,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    findById.mockResolvedValueOnce(dummyClient);

    const useCase = new GetClientByIdUseCase(mockRepository);
    const result = await useCase.execute(1);

    expect(findById).toHaveBeenCalledWith(1);
    expect(result).toBe(dummyClient);
  });

  it('should throw ClientNotFoundError when client is not found', async () => {
    findById.mockResolvedValueOnce(null);

    const useCase = new GetClientByIdUseCase(mockRepository);

    await expect(useCase.execute(999)).rejects.toThrow(
      ClientNotFoundError,
    );
  });
});
