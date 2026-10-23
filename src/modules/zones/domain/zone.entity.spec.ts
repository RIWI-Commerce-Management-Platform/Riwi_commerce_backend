import { describe, expect, it } from 'vitest';
import { Zone } from './zone.entity.js';

describe('Zone Entity', () => {
  it('should initialize and support deactivate', () => {
    const now = new Date();
    const zone = new Zone({
      id: 1,
      name: 'Zona Metropolitana',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(zone.id).toBe(1);
    expect(zone.name).toBe('Zona Metropolitana');
    expect(zone.isActive).toBe(true);

    zone.deactivate();
    expect(zone.isActive).toBe(false);
  });
});
