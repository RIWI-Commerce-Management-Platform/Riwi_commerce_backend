import { describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ZonesController } from './zones.controller.js';
import { CreateZoneUseCase } from '../application/create-zone.use-case.js';
import { ListZonesUseCase } from '../application/list-zones.use-case.js';
import { UpdateZoneUseCase } from '../application/update-zone.use-case.js';
import { Zone } from '../domain/zone.entity.js';
import { ZoneNotFoundError } from '../domain/zone-not-found.error.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';

describe('ZonesController', () => {
  const zone = new Zone({
    id: 1,
    name: 'Galapa',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

  const setup = () => {
    const createZone = { execute: vi.fn() } as unknown as CreateZoneUseCase;
    const listZones = { execute: vi.fn() } as unknown as ListZonesUseCase;
    const updateZone = { execute: vi.fn() } as unknown as UpdateZoneUseCase;
    const controller = new ZonesController(createZone, listZones, updateZone);
    return { controller, createZone, listZones, updateZone };
  };

  it('lists zones', async () => {
    const { controller, listZones } = setup();
    vi.mocked(listZones.execute).mockResolvedValue([zone]);

    const result = await controller.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Galapa');
  });

  it('creates a zone', async () => {
    const { controller, createZone } = setup();
    vi.mocked(createZone.execute).mockResolvedValue(zone);

    const result = await controller.create({ name: 'Galapa' });

    expect(createZone.execute).toHaveBeenCalledWith({ name: 'Galapa' });
    expect(result.id).toBe(1);
  });

  it('maps a duplicate name on create to 409', async () => {
    const { controller, createZone } = setup();
    vi.mocked(createZone.execute).mockRejectedValue(
      new ZoneNameAlreadyExistsError('Galapa'),
    );

    await expect(controller.create({ name: 'Galapa' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates a zone', async () => {
    const { controller, updateZone } = setup();
    vi.mocked(updateZone.execute).mockResolvedValue(zone);

    await controller.update(1, { name: 'Galapa', isActive: false });

    expect(updateZone.execute).toHaveBeenCalledWith({
      id: 1,
      name: 'Galapa',
      isActive: false,
    });
  });

  it('maps a missing zone on update to 404', async () => {
    const { controller, updateZone } = setup();
    vi.mocked(updateZone.execute).mockRejectedValue(new ZoneNotFoundError(9));

    await expect(controller.update(9, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rethrows unknown errors', async () => {
    const { controller, updateZone } = setup();
    const boom = new Error('boom');
    vi.mocked(updateZone.execute).mockRejectedValue(boom);

    await expect(controller.update(1, {})).rejects.toBe(boom);
  });
});
