import { describe, expect, it, vi } from 'vitest';
import { UpdateZoneUseCase } from './update-zone.use-case.js';
import { ZoneDao } from '../domain/zone.dao.js';
import { Zone } from '../domain/zone.entity.js';
import { ZoneNotFoundError } from '../domain/zone-not-found.error.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';

describe('UpdateZoneUseCase', () => {
  const buildZone = (props: Partial<Zone> = {}) =>
    new Zone({
      id: 1,
      name: 'Soledad',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...props,
    });

  const setup = (zone: Zone | null, byName: Zone | null = null) => {
    const dao = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(zone),
      findByName: vi.fn().mockResolvedValue(byName),
      save: vi.fn().mockImplementation((z: Zone) => Promise.resolve(z)),
    } as unknown as ZoneDao;
    return { useCase: new UpdateZoneUseCase(dao), dao };
  };

  it('renames and deactivates a zone', async () => {
    const { useCase, dao } = setup(buildZone());

    const result = await useCase.execute({
      id: 1,
      name: 'Soledad Centro',
      isActive: false,
    });

    expect(result.name).toBe('Soledad Centro');
    expect(result.isActive).toBe(false);
    expect(dao.save).toHaveBeenCalledWith(result);
  });

  it('throws ZoneNotFoundError when the zone does not exist', async () => {
    const { useCase, dao } = setup(null);

    await expect(useCase.execute({ id: 99, name: 'X' })).rejects.toBeInstanceOf(
      ZoneNotFoundError,
    );
    expect(dao.save).not.toHaveBeenCalled();
  });

  it('throws ZoneNameAlreadyExistsError when the new name is taken', async () => {
    const { useCase } = setup(
      buildZone(),
      buildZone({ id: 2, name: 'Malambo' }),
    );

    await expect(
      useCase.execute({ id: 1, name: 'Malambo' }),
    ).rejects.toBeInstanceOf(ZoneNameAlreadyExistsError);
  });

  it('skips the name check when the name is unchanged or omitted', async () => {
    const { useCase, dao } = setup(buildZone());

    await useCase.execute({ id: 1, name: 'Soledad' });
    await useCase.execute({ id: 1, isActive: false });

    expect(dao.findByName).not.toHaveBeenCalled();
  });
});
