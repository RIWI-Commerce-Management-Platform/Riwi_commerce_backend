import { describe, expect, it } from 'vitest';
import { ClientContact } from './client-contact.entity.js';

describe('ClientContact Entity', () => {
  const createBaseContact = (isPrimary = false): ClientContact => {
    return new ClientContact({
      id: 1,
      clientId: 10,
      name: 'Carlos Mendoza',
      position: 'Gerente Comercial',
      phone: '+576053001122',
      mobile: '+573009876543',
      email: 'carlos@empresa.com',
      isPrimary,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  };

  it('should instantiate correctly with given props', () => {
    const contact = createBaseContact(true);

    expect(contact.id).toBe(1);
    expect(contact.clientId).toBe(10);
    expect(contact.name).toBe('Carlos Mendoza');
    expect(contact.isPrimary).toBe(true);
    expect(contact.isActive).toBe(true);
  });

  it('should mark contact as primary and update timestamp', () => {
    const contact = createBaseContact(false);
    expect(contact.isPrimary).toBe(false);

    contact.markAsPrimary();
    expect(contact.isPrimary).toBe(true);
  });

  it('should demote contact from primary', () => {
    const contact = createBaseContact(true);
    expect(contact.isPrimary).toBe(true);

    contact.demoteFromPrimary();
    expect(contact.isPrimary).toBe(false);
  });

  it('should deactivate contact and clear primary flag, and activate again', () => {
    const contact = createBaseContact(true);

    contact.deactivate();
    expect(contact.isActive).toBe(false);
    expect(contact.isPrimary).toBe(false);

    contact.activate();
    expect(contact.isActive).toBe(true);
  });

  it('should update editable properties', () => {
    const contact = createBaseContact(false);

    contact.update({
      name: 'Carlos M. Mendoza',
      position: 'Director de Operaciones',
      phone: '+576053998877',
      mobile: '+573001112233',
      email: 'nuevo@empresa.com',
      isPrimary: true,
    });

    expect(contact.name).toBe('Carlos M. Mendoza');
    expect(contact.position).toBe('Director de Operaciones');
    expect(contact.phone).toBe('+576053998877');
    expect(contact.mobile).toBe('+573001112233');
    expect(contact.email).toBe('nuevo@empresa.com');
    expect(contact.isPrimary).toBe(true);
  });
});
