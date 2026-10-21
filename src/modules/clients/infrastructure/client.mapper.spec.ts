import { describe, expect, it } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientMapper } from './client.mapper.js';
import { ClientOrmEntity } from './client.orm-entity.js';

describe('ClientMapper', () => {
  it('should map from ORM entity to domain entity correctly', () => {
    const orm = new ClientOrmEntity();
    orm.id = 1;
    orm.nit = '900123456-1';
    orm.businessName = 'Distribuidora Los Andes S.A.S.';
    orm.commercialName = 'Los Andes Market';
    orm.address = 'Calle 50 # 45-20';
    orm.department = 'Antioquia';
    orm.municipality = 'Medellín';
    orm.neighborhood = 'Laureles';
    orm.phone = '+573001234567';
    orm.email = 'contacto@losandes.com';
    orm.zoneId = 10;
    orm.clientTypeId = 20;
    orm.potentialId = 30;
    orm.clientStatusId = 40;
    orm.visitFrequencyDays = 15;
    orm.latitude = 6.2442;
    orm.longitude = -75.5812;
    orm.isActive = true;
    orm.createdAt = new Date('2026-01-01');
    orm.updatedAt = new Date('2026-01-02');

    const domain = ClientMapper.toDomain(orm);

    expect(domain.id).toBe(1);
    expect(domain.nit).toBe(orm.nit);
    expect(domain.businessName).toBe(orm.businessName);
    expect(domain.latitude).toBe(6.2442);
    expect(domain.longitude).toBe(-75.5812);
    expect(domain.isActive).toBe(true);
  });

  it('should map from domain entity to ORM entity correctly', () => {
    const domain = new Client({
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
      latitude: null,
      longitude: null,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    });

    const orm = ClientMapper.toOrm(domain);

    expect(orm.id).toBe(1);
    expect(orm.nit).toBe(domain.nit);
    expect(orm.latitude).toBeNull();
    expect(orm.longitude).toBeNull();
    expect(orm.isActive).toBe(true);
  });
});
