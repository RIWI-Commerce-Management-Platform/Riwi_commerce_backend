import { describe, expect, it, vi } from 'vitest';
import { ListZonesUseCase } from './list-zones.use-case.js';
import { ZoneRepository } from '../domain/zone.repository.js';

describe('ListZonesUseCase', () => {
  it('returns the zones from the repository', async () => {
    const zones = [{ id: 1, name: 'Soledad' }];
    const repository = {
      findAll: vi.fn().mockResolvedValue(zones),
    } as unknown as ZoneRepository;

    await expect(new ListZonesUseCase(repository).execute()).resolves.toBe(
      zones,
    );
  });
});
