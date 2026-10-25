import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { TypeOrmVisitMapDao } from './typeorm-visit-map.dao.js';

const dbRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  scheduled_at: new Date('2026-10-19T13:00:00Z'),
  status: 'VISITED',
  order_generated: true,
  has_location: true,
  latitude: 10.9925,
  longitude: -74.793,
  client_id: 1,
  commercial_name: 'Autoservicio El Prado',
  address: 'Carrera 54 # 64-120',
  municipality: 'Barranquilla',
  zone_id: 1,
  zone_name: 'Barranquilla Norte',
  advisor_id: 3,
  advisor_name: 'Laura Martinez',
  route_id: 1,
  route_name: 'North weekly route',
  ...overrides,
});

const build = (rows: unknown[]) => {
  // The day query has no FROM; the visits query reads `visits`.
  const query = vi.fn((sql: string) =>
    Promise.resolve(
      sql.includes('FROM visits') ? rows : [{ day: '2026-10-19' }],
    ),
  );
  return {
    dao: new TypeOrmVisitMapDao({ query } as unknown as DataSource),
    query,
  };
};

describe('TypeOrmVisitMapDao', () => {
  it('maps a visit with its location, client, zone, advisor and route', async () => {
    const { dao } = build([dbRow()]);

    await expect(dao.findDayVisits({ date: '2026-10-19' })).resolves.toEqual({
      date: '2026-10-19',
      rows: [
        {
          visitId: 1,
          scheduledAt: new Date('2026-10-19T13:00:00Z'),
          status: 'VISITED',
          orderGenerated: true,
          location: { latitude: 10.9925, longitude: -74.793 },
          client: {
            id: 1,
            commercialName: 'Autoservicio El Prado',
            address: 'Carrera 54 # 64-120',
            municipality: 'Barranquilla',
          },
          zone: { id: 1, name: 'Barranquilla Norte' },
          advisor: { id: 3, name: 'Laura Martinez' },
          route: { id: 1, name: 'North weekly route' },
        },
      ],
    });
  });

  it.each([
    ['missing coordinates', { has_location: null, latitude: null }],
    ['out-of-range coordinates', { has_location: false, latitude: 123 }],
  ])('returns a null location for %s', async (_, overrides) => {
    const { dao } = build([dbRow({ ...overrides, route_id: null })]);

    const { rows } = await dao.findDayVisits({});

    expect(rows[0].location).toBeNull();
    expect(rows[0].route).toBeNull();
  });

  it('sends the day, zone and advisor as parameters', async () => {
    const { dao, query } = build([]);

    await dao.findDayVisits({
      date: '2026-10-19',
      territoryId: 1,
      advisorId: 3,
    });
    await dao.findDayVisits({});

    expect(query.mock.calls[0][1]).toEqual(['America/Bogota', '2026-10-19']);
    expect(query.mock.calls[1][1]).toEqual([
      'America/Bogota',
      '2026-10-19',
      1,
      3,
    ]);
    expect(query.mock.calls[3][1]).toEqual([
      'America/Bogota',
      null,
      null,
      null,
    ]);
  });
});
