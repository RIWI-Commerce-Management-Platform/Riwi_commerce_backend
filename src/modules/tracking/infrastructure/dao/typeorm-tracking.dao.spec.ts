import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { TypeOrmTrackingDao } from './typeorm-tracking.dao.js';
import type { TrackingFilters } from '../../domain/tracking-visit.js';

const dbRow = {
  id: 12,
  scheduled_at: new Date('2026-10-19T13:00:00Z'),
  actual_date: null,
  status: 'PENDING',
  quote_generated: false,
  order_generated: false,
  client_id: 4,
  commercial_name: 'Client',
  zone_id: 1,
  zone_name: 'Zone',
  advisor_id: 3,
  advisor_name: 'Laura',
  route_id: null,
  route_name: null,
};

const build = (total: string, rows: unknown[]) => {
  const query = vi
    .fn()
    .mockResolvedValueOnce([
      { week_start: '2026-10-19', week_end: '2026-10-25', total },
    ])
    .mockResolvedValueOnce(rows);
  return {
    dao: new TypeOrmTrackingDao({ query } as unknown as DataSource),
    query,
  };
};

const filters: TrackingFilters = {
  weekStart: '2026-10-21',
  territoryId: 1,
  page: 2,
  limit: 5,
  order: 'desc',
};

describe('TypeOrmTrackingDao', () => {
  it('maps the rows and builds the pagination meta', async () => {
    const { dao } = build('12', [dbRow]);

    const page = await dao.findVisits(filters);

    expect(page.weekStart).toBe('2026-10-19');
    expect(page.weekEnd).toBe('2026-10-25');
    expect(page.data).toEqual([
      {
        visitId: 12,
        scheduledAt: dbRow.scheduled_at,
        actualDate: null,
        status: 'PENDING',
        quoteGenerated: false,
        orderGenerated: false,
        client: { id: 4, commercialName: 'Client' },
        zone: { id: 1, name: 'Zone' },
        advisor: { id: 3, name: 'Laura' },
        route: null,
      },
    ]);
    expect(page.meta).toEqual({
      total: 12,
      page: 2,
      limit: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('sends every filter as a parameter and pages with LIMIT/OFFSET', async () => {
    const { dao, query } = build('0', []);

    await dao.findVisits(filters);

    const params = ['America/Bogota', '2026-10-21', 1, null, null, null];
    expect(query.mock.calls[0][1]).toEqual(params);
    expect(query.mock.calls[1][1]).toEqual([...params, 5, 5]);
    expect(query.mock.calls[1][0]).toContain(
      'ORDER BY v.scheduled_at DESC, v.id DESC',
    );
  });

  it('returns an empty page with one total page', async () => {
    const { dao } = build('0', []);

    const page = await dao.findVisits({ ...filters, page: 1 });

    expect(page.data).toEqual([]);
    expect(page.meta).toMatchObject({
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
