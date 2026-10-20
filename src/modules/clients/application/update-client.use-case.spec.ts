import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { GeocodingPort } from './ports/geocoding.port.js';
import { UpdateClientUseCase } from './update-client.use-case.js';

describe('UpdateClientUseCase', () => {
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

  const baseProps = {
    id: 'client-1',
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
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const existingClient = new Client(baseProps);

  it('should throw ClientNotFoundError if client does not exist', async () => {
    findById.mockResolvedValueOnce(null);

    const useCase = new UpdateClientUseCase(mockRepository, mockGeocodingPort);

    await expect(
      useCase.execute({ id: 'non-existent-id', commercialName: 'New Name' }),
    ).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw ClientNitAlreadyExistsError when new NIT is taken by another client', async () => {
    findById.mockResolvedValueOnce(existingClient);
    findByNit.mockResolvedValueOnce(
      new Client({
        ...baseProps,
        id: 'different-client-id',
        nit: '900999999-9',
      }),
    );

    const useCase = new UpdateClientUseCase(mockRepository, mockGeocodingPort);

    await expect(
      useCase.execute({ id: 'client-1', nit: '900999999-9' }),
    ).rejects.toThrow(ClientNitAlreadyExistsError);
  });

  it('should recalculate coordinates via geocoder when address changes and coords are omitted', async () => {
    findById.mockResolvedValueOnce(existingClient);
    geocode.mockResolvedValueOnce({
      lat: 6.1759,
      lng: -75.5917,
    });

    const useCase = new UpdateClientUseCase(mockRepository, mockGeocodingPort);
    const result = await useCase.execute({
      id: 'client-1',
      address: 'Carrera 43A # 1-50',
      municipality: 'Envigado',
    });

    expect(geocode).toHaveBeenCalledWith(
      'Carrera 43A # 1-50',
      'Envigado',
      'Antioquia',
    );
    expect(result.latitude).toBe(6.1759);
    expect(result.longitude).toBe(-75.5917);
  });

  it('should not call geocoder if explicit coordinates are provided during address change', async () => {
    findById.mockResolvedValueOnce(existingClient);
    geocode.mockClear();

    const useCase = new UpdateClientUseCase(mockRepository, mockGeocodingPort);
    const result = await useCase.execute({
      id: 'client-1',
      address: 'Carrera 43A # 1-50',
      latitude: 10.0,
      longitude: -74.0,
    });

    expect(geocode).not.toHaveBeenCalled();
    expect(result.latitude).toBe(10.0);
    expect(result.longitude).toBe(-74.0);
  });
});
