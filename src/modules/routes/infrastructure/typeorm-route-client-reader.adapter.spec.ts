import { describe, expect, it, vi } from 'vitest';
import { TypeOrmRouteClientReaderAdapter } from './typeorm-route-client-reader.adapter.js';
import { ClientDao } from '../../clients/domain/client.dao.js';
import { Client } from '../../clients/domain/client.entity.js';

describe('TypeOrmRouteClientReaderAdapter', () => {
  const mockClient = new Client({
    id: 1,
    nit: '900123456-1',
    businessName: 'Distribuidora SA',
    commercialName: 'Super Tienda Norte',
    address: 'Calle 80 # 50-20',
    department: 'Atlántico',
    municipality: 'Barranquilla',
    neighborhood: 'Norte',
    phone: '3001234567',
    email: 'contacto@tienda.com',
    zoneId: 1,
    clientTypeId: 1,
    potentialId: 1,
    clientStatusId: 1,
    visitFrequencyDays: 7,
    latitude: 10.99,
    longitude: -74.8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockClientDao = (): ClientDao => ({
    findById: vi.fn().mockImplementation((id: number) => {
      if (id === 1) return Promise.resolve(mockClient);
      return Promise.resolve(null);
    }),
    findByNit: vi.fn(),
    findPaginated: vi.fn(),
    save: vi.fn(),
  });

  it('should find a client by id and map to RouteClientDetails', async () => {
    const dao = createMockClientDao();
    const adapter = new TypeOrmRouteClientReaderAdapter(dao);

    const result = await adapter.findById(1);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.commercialName).toBe('Super Tienda Norte');
    expect(result?.latitude).toBe(10.99);
    expect(result?.zoneId).toBe(1);
  });

  it('should return null when client is not found', async () => {
    const dao = createMockClientDao();
    const adapter = new TypeOrmRouteClientReaderAdapter(dao);

    const result = await adapter.findById(999);
    expect(result).toBeNull();
  });

  it('should find multiple clients by ids', async () => {
    const dao = createMockClientDao();
    const adapter = new TypeOrmRouteClientReaderAdapter(dao);

    const results = await adapter.findByIds([1, 999]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it('returns an empty list without querying when no ids are given', async () => {
    const dao = createMockClientDao();

    const results = await new TypeOrmRouteClientReaderAdapter(dao).findByIds(
      [],
    );

    expect(results).toEqual([]);
    expect(dao.findById).not.toHaveBeenCalled();
  });
});
