import { describe, expect, it, vi } from 'vitest';
import { UpdateZoneUseCase } from './update-zone.use-case.js';
import { ZoneRepository } from '../domain/zone.repository.js';
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
    const repository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(zone),
      findByName: vi.fn().mockResolvedValue(byName),
      save: vi.fn().mockImplementation((z: Zone) => Promise.resolve(z)),
    } as unknown as ZoneRepository;
    return { useCase: new UpdateZoneUseCase(repository), repository };
  };

  it('renames and deactivates a zone', async () => {
    const { useCase, repository } = setup(buildZone());

    const result = await useCase.execute({
      id: 1,
      name: 'Soledad Centro',
      isActive: false,
    });

    expect(result.name).toBe('Soledad Centro');
    expect(result.isActive).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('throws ZoneNotFoundError when the zone does not exist', async () => {
    const { useCase, repository } = setup(null);

    await expect(useCase.execute({ id: 99, name: 'X' })).rejects.toBeInstanceOf(
      ZoneNotFoundError,
    );
    expect(repository.save).not.toHaveBeenCalled();
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
    const { useCase, repository } = setup(buildZone());

    await useCase.execute({ id: 1, name: 'Soledad' });
    await useCase.execute({ id: 1, isActive: false });

    expect(repository.findByName).not.toHaveBeenCalled();
  });
});
