import { describe, expect, it, vi } from 'vitest';
import { CreateZoneUseCase } from './create-zone.use-case.js';
import { ZoneRepository } from '../domain/zone.repository.js';
import { Zone } from '../domain/zone.entity.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';

describe('CreateZoneUseCase', () => {
  const setup = (existing: Zone | null) => {
    const repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn().mockResolvedValue(existing),
      save: vi.fn().mockImplementation((z: Zone) => Promise.resolve(z)),
    } as unknown as ZoneRepository;
    return { useCase: new CreateZoneUseCase(repository), repository };
  };

  it('creates an active zone', async () => {
    const { useCase, repository } = setup(null);

    const zone = await useCase.execute({ name: 'Galapa' });

    expect(zone.name).toBe('Galapa');
    expect(zone.isActive).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(zone);
  });

  it('rejects a duplicate name', async () => {
    const existing = new Zone({
      id: 1,
      name: 'Galapa',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { useCase, repository } = setup(existing);

    await expect(useCase.execute({ name: 'Galapa' })).rejects.toBeInstanceOf(
      ZoneNameAlreadyExistsError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
