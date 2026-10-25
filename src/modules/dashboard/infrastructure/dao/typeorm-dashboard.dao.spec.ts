import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { TypeOrmDashboardDao } from './typeorm-dashboard.dao.js';

const build = () => {
  const dataSource = {
    query: vi.fn().mockResolvedValue([
      {
        week_start: '2026-10-19',
        week_end: '2026-10-25',
        scheduled_visits: '18',
        completed_visits: '6',
        quoted_amount: '2204000.10',
        closed_orders: '1',
      },
    ]),
  };
  return {
    dao: new TypeOrmDashboardDao(dataSource as unknown as DataSource),
    dataSource,
  };
};

describe('TypeOrmDashboardDao', () => {
  it('maps the row and keeps the amount as an exact decimal', async () => {
    const { dao } = build();

    await expect(
      dao.getWeeklyMetrics({ weekStart: '2026-10-21', territoryId: 4 }),
    ).resolves.toEqual({
      weekStart: '2026-10-19',
      weekEnd: '2026-10-25',
      scheduledVisits: 18,
      completedVisits: 6,
      quotedAmount: '2204000.10',
      closedOrders: 1,
    });
  });

  it('sends the day, zone and timezone as parameters', async () => {
    const { dao, dataSource } = build();

    await dao.getWeeklyMetrics({ weekStart: '2026-10-21', territoryId: 4 });
    await dao.getWeeklyMetrics({});

    expect(dataSource.query.mock.calls[0][1]).toEqual([
      '2026-10-21',
      4,
      'America/Bogota',
    ]);
    expect(dataSource.query.mock.calls[1][1]).toEqual([
      null,
      null,
      'America/Bogota',
    ]);
  });
});
