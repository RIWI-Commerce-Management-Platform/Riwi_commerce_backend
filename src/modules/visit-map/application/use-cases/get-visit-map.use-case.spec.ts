import { describe, expect, it, vi } from 'vitest';
import { GetVisitMapUseCase } from './get-visit-map.use-case.js';
import type { VisitMapDao } from '../../domain/dao/visit-map.dao.js';
import type { VisitMapRow } from '../../domain/visit-map.js';
import { UserRole } from '../../../auth/domain/user-role.enum.js';

const row = (
  visitId: number,
  status: string,
  overrides: Partial<VisitMapRow> = {},
): VisitMapRow => ({
  visitId,
  scheduledAt: new Date('2026-10-19T13:00:00Z'),
  status,
  orderGenerated: false,
  location: { latitude: 10.99, longitude: -74.79 },
  client: { id: 1, commercialName: 'C', address: 'A', municipality: 'M' },
  zone: { id: 1, name: 'Z' },
  advisor: { id: 3, name: 'Laura' },
  route: null,
  ...overrides,
});

const build = (rows: VisitMapRow[]) => {
  const dao = {
    findDayVisits: vi.fn().mockResolvedValue({ date: '2026-10-19', rows }),
  };
  return {
    dao,
    useCase: new GetVisitMapUseCase(dao as unknown as VisitMapDao),
  };
};

describe('GetVisitMapUseCase (HU-36)', () => {
  it('classifies every visit and counts the legend and missing locations', async () => {
    const { useCase } = build([
      row(1, 'VISITED', { orderGenerated: true }),
      row(2, 'VISITED'),
      row(3, 'PENDING', { location: null }),
      row(4, 'NOT_VISITED'),
      row(5, 'RESCHEDULE'),
    ]);

    const map = await useCase.execute({ date: '2026-10-19' });

    expect(map.date).toBe('2026-10-19');
    expect(map.total).toBe(5);
    expect(map.withoutLocation).toBe(1);
    expect(map.counts).toEqual({
      VISITED: 1,
      PENDING: 1,
      NOT_VISITED: 1,
      ORDER_CLOSED: 1,
      RESCHEDULED: 1,
    });
    expect(map.data.map((marker) => marker.mapStatus)).toEqual([
      'ORDER_CLOSED',
      'VISITED',
      'PENDING',
      'NOT_VISITED',
      'RESCHEDULED',
    ]);
    expect(map.data[2].location).toBeNull();
  });

  it('returns zeros for a day without visits', async () => {
    const map = await build([]).useCase.execute({});

    expect(map).toMatchObject({ total: 0, withoutLocation: 0, data: [] });
    expect(Object.values(map.counts)).toEqual([0, 0, 0, 0, 0]);
  });

  it('keeps the filters for an admin', async () => {
    const { dao, useCase } = build([]);

    await useCase.execute(
      { date: '2026-10-19', territoryId: 2, advisorId: 3 },
      { id: 1, role: UserRole.ADMIN, zoneId: null },
    );

    expect(dao.findDayVisits).toHaveBeenCalledWith({
      date: '2026-10-19',
      territoryId: 2,
      advisorId: 3,
    });
  });

  it("forces a regional director's own zone", async () => {
    const { dao, useCase } = build([]);

    await useCase.execute(
      { territoryId: 2 },
      { id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 7 },
    );

    expect(dao.findDayVisits).toHaveBeenCalledWith({ territoryId: 7 });
  });
});
