import { describe, expect, it } from 'vitest';
import { Client } from './client.entity.js';

describe('Client Entity', () => {
  const createBaseClient = (): Client => {
    return new Client({
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
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  };

  it('should instantiate correctly with given props', () => {
    const client = createBaseClient();

    expect(client.id).toBe(1);
    expect(client.nit).toBe('900123456-1');
    expect(client.businessName).toBe('Distribuidora Los Andes S.A.S.');
    expect(client.isActive).toBe(true);
    expect(client.latitude).toBe(6.2442);
    expect(client.longitude).toBe(-75.5812);
  });

  it('should deactivate client and update updatedAt', () => {
    const client = createBaseClient();
    const oldUpdatedAt = client.updatedAt;

    client.deactivate();

    expect(client.isActive).toBe(false);
    expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
      oldUpdatedAt.getTime(),
    );
  });

  it('should activate client and update updatedAt', () => {
    const client = createBaseClient();
    client.deactivate();
    expect(client.isActive).toBe(false);

    client.activate();
    expect(client.isActive).toBe(true);
  });

  it('should update mutable properties and updatedAt', () => {
    const client = createBaseClient();

    client.update({
      commercialName: 'Updated Supermarket',
      address: 'Carrera 70 # 10-15',
      municipality: 'Envigado',
      visitFrequencyDays: 30,
      latitude: 6.1759,
      longitude: -75.5917,
    });

    expect(client.commercialName).toBe('Updated Supermarket');
    expect(client.address).toBe('Carrera 70 # 10-15');
    expect(client.municipality).toBe('Envigado');
    expect(client.visitFrequencyDays).toBe(30);
    expect(client.latitude).toBe(6.1759);
    expect(client.longitude).toBe(-75.5917);
    // Unchanged properties
    expect(client.nit).toBe('900123456-1');
    expect(client.businessName).toBe('Distribuidora Los Andes S.A.S.');
  });
});
