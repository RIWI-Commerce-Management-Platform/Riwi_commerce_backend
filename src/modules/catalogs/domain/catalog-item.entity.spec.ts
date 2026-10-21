import { describe, expect, it } from 'vitest';
import {
  ClientType,
  Potential,
  ClientStatus,
  Portfolio,
  VisitResult,
} from './catalog-item.entity.js';

describe('Catalog Domain Entities', () => {
  it('should instantiate and update ClientType', () => {
    const item = new ClientType({
      id: 'uuid-1',
      name: 'Mayorista',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(item.name).toBe('Mayorista');
    expect(item.isActive).toBe(true);

    item.updateName('Super Mayorista');
    expect(item.name).toBe('Super Mayorista');

    item.deactivate();
    expect(item.isActive).toBe(false);
  });

  it('should instantiate and update Potential with order', () => {
    const item = new Potential({
      id: 'uuid-2',
      name: 'Alto',
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(item.name).toBe('Alto');
    expect(item.order).toBe(1);

    item.update('Muy Alto', 0);
    expect(item.name).toBe('Muy Alto');
    expect(item.order).toBe(0);
  });

  it('should instantiate and update Portfolio with description', () => {
    const item = new Portfolio({
      id: 'uuid-3',
      name: 'Abarrotes',
      description: 'Línea de granos',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(item.name).toBe('Abarrotes');
    expect(item.description).toBe('Línea de granos');

    item.update('Abarrotes y Granos', 'Nueva descripción');
    expect(item.name).toBe('Abarrotes y Granos');
    expect(item.description).toBe('Nueva descripción');
  });

  it('should instantiate and deactivate VisitResult', () => {
    const item = new VisitResult({
      id: 'uuid-4',
      name: 'Venta Exitosa',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(item.name).toBe('Venta Exitosa');
    item.deactivate();
    expect(item.isActive).toBe(false);
  });
});
