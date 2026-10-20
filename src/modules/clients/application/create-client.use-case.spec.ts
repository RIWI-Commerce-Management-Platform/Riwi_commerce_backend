import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
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

  const mockRepository: ClientRepository = {
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
    zoneId: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb',
    clientTypeId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    potentialId: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    clientStatusId: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
    visitFrequencyDays: 15,
  };

  it('should throw ClientNitAlreadyExistsError when NIT already exists', async () => {
    findByNit.mockResolvedValueOnce(
      new Client({
        ...baseInput,
        id: 'existing-id',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const useCase = new CreateClientUseCase(mockRepository, mockGeocodingPort);

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

    const useCase = new CreateClientUseCase(mockRepository, mockGeocodingPort);
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

    const useCase = new CreateClientUseCase(mockRepository, mockGeocodingPort);
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

    const useCase = new CreateClientUseCase(mockRepository, mockGeocodingPort);
    const result = await useCase.execute(baseInput);

    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });
});

