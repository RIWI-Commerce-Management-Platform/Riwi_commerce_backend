import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { GeocodingPort } from './ports/geocoding.port.js';
import {
  CreateClientInput,
  CreateClientUseCase,
} from './create-client.use-case.js';

describe('CreateClientUseCase', () => {
  const save = vi.fn(async (client: Client) => client);
  const findById = vi.fn();
  const findByNit = vi.fn();
  const findPaginated = vi.fn();

  const mockDao: ClientDao = {
    save,
    findById,
    findByNit,
    findPaginated,
  };

  const geocode = vi.fn();
  const mockGeocodingPort: GeocodingPort = {
    geocode,
  };

  const baseInput: CreateClientInput = {
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
  };

  it('should throw ClientNitAlreadyExistsError when NIT already exists', async () => {
    findByNit.mockResolvedValueOnce(
      new Client({
        ...baseInput,
        id: 99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const useCase = new CreateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      ClientNitAlreadyExistsError,
    );
  });

  it('should autocalculate coordinates via geocoder when not provided', async () => {
    findByNit.mockResolvedValueOnce(null);
    geocode.mockResolvedValueOnce({
      lat: 6.2442,
      lng: -75.5812,
    });

    const useCase = new CreateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute(baseInput);

    expect(geocode).toHaveBeenCalledWith(
      'Calle 50 # 45-20',
      'Medellín',
      'Antioquia',
    );
    expect(result.latitude).toBe(6.2442);
    expect(result.longitude).toBe(-75.5812);
    expect(result.isActive).toBe(true);
    expect(save).toHaveBeenCalled();
  });

  it('should use provided coordinates without invoking geocoder', async () => {
    findByNit.mockResolvedValueOnce(null);
    geocode.mockClear();

    const useCase = new CreateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({
      ...baseInput,
      latitude: 10.9685,
      longitude: -74.7813,
    });

    expect(geocode).not.toHaveBeenCalled();
    expect(result.latitude).toBe(10.9685);
    expect(result.longitude).toBe(-74.7813);
  });

  it('should leave coordinates as null when geocoding returns null', async () => {
    findByNit.mockResolvedValueOnce(null);
    geocode.mockResolvedValueOnce(null);

    const useCase = new CreateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute(baseInput);

    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  it('records the new client in the activity log when an actor is given', async () => {
    findByNit.mockResolvedValueOnce(null);
    geocode.mockResolvedValueOnce(null);
    const record = vi.fn();
    const useCase = new CreateClientUseCase(mockDao, mockGeocodingPort, {
      record,
    } as any);

    await useCase.execute({ ...baseInput, actorId: 3 });

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'client.created', actorId: 3 }),
    );
  });
});
