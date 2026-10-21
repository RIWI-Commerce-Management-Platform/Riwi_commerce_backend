import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ToggleClientStatusUseCase } from './toggle-client-status.use-case.js';

describe('ToggleClientStatusUseCase', () => {
  const save = vi.fn(async (client: Client) => client);
  const findById = vi.fn();
  const findByNit = vi.fn();
  const findPaginated = vi.fn();

  const mockRepository: ClientRepository = {
    save,
    findById,
    findByNit,
    findPaginated,
  };

  const createActiveClient = () =>
    new Client({
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
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  it('should throw ClientNotFoundError if client does not exist', async () => {
    findById.mockResolvedValueOnce(null);

    const useCase = new ToggleClientStatusUseCase(mockRepository);

    await expect(useCase.execute({ id: 999 })).rejects.toThrow(
      ClientNotFoundError,
    );
  });

  it('should toggle from active to inactive when isActive is not specified', async () => {
    const client = createActiveClient();
    findById.mockResolvedValueOnce(client);

    const useCase = new ToggleClientStatusUseCase(mockRepository);
    const result = await useCase.execute({ id: 1 });

    expect(result.isActive).toBe(false);
    expect(save).toHaveBeenCalledWith(client);
  });

  it('should explicitly activate client when isActive is true', async () => {
    const client = createActiveClient();
    client.deactivate();
    findById.mockResolvedValueOnce(client);

    const useCase = new ToggleClientStatusUseCase(mockRepository);
    const result = await useCase.execute({ id: 1, isActive: true });

    expect(result.isActive).toBe(true);
  });
});
