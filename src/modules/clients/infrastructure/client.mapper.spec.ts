import { describe, expect, it } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientMapper } from './client.mapper.js';
import { ClientOrmEntity } from './client.orm-entity.js';

describe('ClientMapper', () => {
  it('should map from ORM entity to domain entity correctly', () => {
    const orm = new ClientOrmEntity();
    orm.id = 'c4e5f6a7-1234-4567-89ab-cdef01234567';
    orm.nit = '900123456-1';
    orm.businessName = 'Distribuidora Los Andes S.A.S.';
    orm.commercialName = 'Los Andes Market';
    orm.address = 'Calle 50 # 45-20';
    orm.department = 'Antioquia';
    orm.municipality = 'Medellín';
    orm.neighborhood = 'Laureles';
    orm.phone = '+573001234567';
    orm.email = 'contacto@losandes.com';
    orm.zoneId = 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb';
    orm.clientTypeId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    orm.potentialId = 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f';
    orm.clientStatusId = 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a';
    orm.visitFrequencyDays = 15;
    orm.latitude = 6.2442;
    orm.longitude = -75.5812;
    orm.isActive = true;
    orm.createdAt = new Date('2026-01-01');
    orm.updatedAt = new Date('2026-01-02');

    const domain = ClientMapper.toDomain(orm);

    expect(domain.id).toBe(orm.id);
    expect(domain.nit).toBe(orm.nit);
    expect(domain.businessName).toBe(orm.businessName);
    expect(domain.latitude).toBe(6.2442);
    expect(domain.longitude).toBe(-75.5812);
    expect(domain.isActive).toBe(true);
  });

  it('should map from domain entity to ORM entity correctly', () => {
    const domain = new Client({
      id: 'c4e5f6a7-1234-4567-89ab-cdef01234567',
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
      latitude: null,
      longitude: null,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    });

    const orm = ClientMapper.toOrm(domain);

    expect(orm.id).toBe(domain.id);
    expect(orm.nit).toBe(domain.nit);
    expect(orm.latitude).toBeNull();
    expect(orm.longitude).toBeNull();
    expect(orm.isActive).toBe(true);
  });
});

