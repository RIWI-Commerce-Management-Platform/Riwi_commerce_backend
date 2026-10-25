import { describe, expect, it, vi } from 'vitest';
import { ListZonesUseCase } from './list-zones.use-case.js';
import { ZoneDao } from '../domain/zone.dao.js';

describe('ListZonesUseCase', () => {
  it('returns the zones from the dao', async () => {
    const zones = [{ id: 1, name: 'Soledad' }];
    const dao = {
      findAll: vi.fn().mockResolvedValue(zones),
    } as unknown as ZoneDao;

    await expect(new ListZonesUseCase(dao).execute()).resolves.toBe(zones);
  });
});
