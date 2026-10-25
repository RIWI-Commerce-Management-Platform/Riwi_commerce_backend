import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { GeocodingPort } from './ports/geocoding.port.js';
import { UpdateClientUseCase } from './update-client.use-case.js';

describe('UpdateClientUseCase', () => {
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

  const baseProps = {
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
    latitude: 6.2442,
    longitude: -75.5812,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const existingClient = new Client(baseProps);

  it('should throw ClientNotFoundError if client does not exist', async () => {
    findById.mockResolvedValueOnce(null);

    const useCase = new UpdateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);

    await expect(
      useCase.execute({ id: 999, commercialName: 'New Name' }),
    ).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw ClientNitAlreadyExistsError when new NIT is taken by another client', async () => {
    findById.mockResolvedValueOnce(existingClient);
    findByNit.mockResolvedValueOnce(
      new Client({
        ...baseProps,
        id: 2,
        nit: '900999999-9',
      }),
    );

    const useCase = new UpdateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);

    await expect(
      useCase.execute({ id: 1, nit: '900999999-9' }),
    ).rejects.toThrow(ClientNitAlreadyExistsError);
  });

  it('should recalculate coordinates via geocoder when address changes and coords are omitted', async () => {
    findById.mockResolvedValueOnce(existingClient);
    geocode.mockResolvedValueOnce({
      lat: 6.1759,
      lng: -75.5917,
    });

    const useCase = new UpdateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({
      id: 1,
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

    const useCase = new UpdateClientUseCase(mockDao, mockGeocodingPort, {
      record: vi.fn(),
    } as any);
    const result = await useCase.execute({
      id: 1,
      address: 'Carrera 43A # 1-50',
      latitude: 10.0,
      longitude: -74.0,
    });

    expect(geocode).not.toHaveBeenCalled();
    expect(result.latitude).toBe(10.0);
    expect(result.longitude).toBe(-74.0);
  });

  const buildUseCase = (record = vi.fn()) =>
    new UpdateClientUseCase(mockDao, mockGeocodingPort, { record } as any);

  it('allows a new NIT that nobody else uses', async () => {
    findById.mockResolvedValueOnce(new Client(baseProps));
    findByNit.mockResolvedValueOnce(null);

    const result = await buildUseCase().execute({ id: 1, nit: '800000000-1' });

    expect(result.nit).toBe('800000000-1');
  });

  it('allows a NIT already owned by the same client', async () => {
    findById.mockResolvedValueOnce(new Client(baseProps));
    findByNit.mockResolvedValueOnce(new Client(baseProps));

    await expect(
      buildUseCase().execute({ id: 1, nit: '800000000-1' }),
    ).resolves.toBeInstanceOf(Client);
  });

  it('geocodes with the stored address when only the municipality changes', async () => {
    findById.mockResolvedValueOnce(new Client(baseProps));
    geocode.mockClear();
    geocode.mockResolvedValueOnce(null);

    const result = await buildUseCase().execute({
      id: 1,
      municipality: 'Envigado',
      department: 'Antioquia',
    });

    expect(geocode).toHaveBeenCalledWith(
      'Calle 50 # 45-20',
      'Envigado',
      'Antioquia',
    );
    expect(result.latitude).toBe(6.2442);
    expect(result.longitude).toBe(-75.5812);
  });

  it('geocodes when only the department changes', async () => {
    findById.mockResolvedValueOnce(new Client(baseProps));
    geocode.mockClear();
    geocode.mockResolvedValueOnce({ lat: 1, lng: 2 });

    const result = await buildUseCase().execute({
      id: 1,
      department: 'Cundinamarca',
    });

    expect(geocode).toHaveBeenCalledWith(
      'Calle 50 # 45-20',
      'Medellín',
      'Cundinamarca',
    );
    expect(result.latitude).toBe(1);
  });

  it('updates every field and records the change', async () => {
    findById.mockResolvedValueOnce(new Client(baseProps));
    findByNit.mockResolvedValueOnce(null);
    const record = vi.fn().mockResolvedValue(undefined);

    const result = await buildUseCase(record).execute({
      id: 1,
      actorId: 3,
      nit: '811111111-1',
      businessName: 'Nueva Razón S.A.S.',
      commercialName: 'Nueva',
      address: 'Calle 1',
      department: 'Atlántico',
      municipality: 'Soledad',
      neighborhood: 'Centro',
      phone: '3000000000',
      email: 'nueva@example.com',
      zoneId: 2,
      clientTypeId: 3,
      potentialId: 4,
      clientStatusId: 5,
      visitFrequencyDays: 30,
      latitude: null,
      longitude: null,
    });

    expect(result).toMatchObject({
      nit: '811111111-1',
      businessName: 'Nueva Razón S.A.S.',
      address: 'Calle 1',
      department: 'Atlántico',
      neighborhood: 'Centro',
      phone: '3000000000',
      email: 'nueva@example.com',
      zoneId: 2,
      clientTypeId: 3,
      potentialId: 4,
      clientStatusId: 5,
      latitude: null,
      longitude: null,
    });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'client.updated', actorId: 3 }),
    );
  });
});
