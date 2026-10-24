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
      zoneId: 10,
      clientTypeId: 20,
      potentialId: 30,
      clientStatusId: 40,
      visitFrequencyDays: 15,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  it('should throw ClientNotFoundError if client does not exist', async () => {
    findById.mockResolvedValueOnce(null);

    const useCase = new ToggleClientStatusUseCase(mockRepository, {
      record: vi.fn(),
    } as any);

    await expect(useCase.execute({ id: 999 })).rejects.toThrow(
      ClientNotFoundError,
    );
  });

  it('should toggle from active to inactive when isActive is not specified', async () => {
    const client = createActiveClient();
    findById.mockResolvedValueOnce(client);

    const useCase = new ToggleClientStatusUseCase(mockRepository, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({ id: 1 });

    expect(result.isActive).toBe(false);
    expect(save).toHaveBeenCalledWith(client);
  });

  it('should toggle from inactive to active when isActive is not specified', async () => {
    const client = createActiveClient();
    client.deactivate();
    findById.mockResolvedValueOnce(client);

    const useCase = new ToggleClientStatusUseCase(mockRepository, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({ id: 1 });

    expect(result.isActive).toBe(true);
    expect(save).toHaveBeenCalledWith(client);
  });

  it('should explicitly activate client when isActive is true', async () => {
    const client = createActiveClient();
    client.deactivate();
    findById.mockResolvedValueOnce(client);

    const useCase = new ToggleClientStatusUseCase(mockRepository, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({ id: 1, isActive: true });

    expect(result.isActive).toBe(true);
  });

  it('should explicitly deactivate client when isActive is false', async () => {
    const client = createActiveClient();
    findById.mockResolvedValueOnce(client);

    const useCase = new ToggleClientStatusUseCase(mockRepository, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({ id: 1, isActive: false });

    expect(result.isActive).toBe(false);
  });
});
