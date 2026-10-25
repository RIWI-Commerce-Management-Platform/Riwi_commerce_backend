import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TrackingDao } from '../../domain/dao/tracking.dao.js';
import {
  BUSINESS_TIMEZONE,
  TrackingFilters,
  TrackingVisitRow,
  TrackingVisitsPage,
} from '../../domain/tracking-visit.js';

/**
 * $1 = timezone, $2 = any day of the week (or null for today),
 * $3 = zone, $4 = advisor, $5 = route, $6 = status (null = no filter).
 *
 * `week` turns the day into [Monday 00:00, next Monday 00:00) in Bogotá
 * time. The territory is the client's zone, as in HU-35 and HU-40.
 */
const WEEK_CTE = `
  WITH week AS (
    SELECT monday,
           monday::timestamp AT TIME ZONE $1 AS starts_at,
           (monday + 7)::timestamp AT TIME ZONE $1 AS ends_at
      FROM (SELECT date_trunc('week', COALESCE($2::date, (now() AT TIME ZONE $1)::date))::date AS monday) AS day
  )`;

const FILTERED_VISITS = `
    FROM visits v
    JOIN week ON v.scheduled_at >= week.starts_at AND v.scheduled_at < week.ends_at
    JOIN clients c ON c.id = v.client_id
    JOIN zones z ON z.id = c.zone_id
    LEFT JOIN "user" u ON u.id = v.advisor_id
    LEFT JOIN routes r ON r.id = v.route_id
   WHERE ($3::int IS NULL OR c.zone_id = $3)
     AND ($4::int IS NULL OR v.advisor_id = $4)
     AND ($5::int IS NULL OR v.route_id = $5)
     AND ($6::text IS NULL OR v.status = $6)`;

const COUNT_SQL = `${WEEK_CTE}
  SELECT to_char(week.monday, 'YYYY-MM-DD') AS week_start,
         to_char(week.monday + 6, 'YYYY-MM-DD') AS week_end,
         (SELECT COUNT(*) ${FILTERED_VISITS}) AS total
    FROM week`;

/** Only these two literals ever reach the ORDER BY. */
const ORDER_SQL = { asc: 'ASC', desc: 'DESC' } as const;

const pageSql = (order: TrackingFilters['order']) => `${WEEK_CTE}
  SELECT v.id, v.scheduled_at, to_char(v.actual_date, 'YYYY-MM-DD') AS actual_date,
         v.status, v.quote_generated, v.order_generated,
         c.id AS client_id, c.commercial_name,
         z.id AS zone_id, z.name AS zone_name,
         v.advisor_id, u.name AS advisor_name,
         r.id AS route_id, r.name AS route_name
  ${FILTERED_VISITS}
   ORDER BY v.scheduled_at ${ORDER_SQL[order]}, v.id ${ORDER_SQL[order]}
   LIMIT $7 OFFSET $8`;

const toRow = (row: any): TrackingVisitRow => ({
  visitId: Number(row.id),
  scheduledAt: row.scheduled_at,
  actualDate: row.actual_date,
  status: row.status,
  quoteGenerated: row.quote_generated,
  orderGenerated: row.order_generated,
  client: { id: Number(row.client_id), commercialName: row.commercial_name },
  zone: { id: Number(row.zone_id), name: row.zone_name },
  advisor: { id: Number(row.advisor_id), name: row.advisor_name },
  route:
    row.route_id === null
      ? null
      : { id: Number(row.route_id), name: row.route_name },
});

@Injectable()
export class TypeOrmTrackingDao implements TrackingDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findVisits(filters: TrackingFilters): Promise<TrackingVisitsPage> {
    const params = [
      BUSINESS_TIMEZONE,
      filters.weekStart ?? null,
      filters.territoryId ?? null,
      filters.advisorId ?? null,
      filters.routeId ?? null,
      filters.status ?? null,
    ];
    const [[summary], rows] = await Promise.all([
      this.dataSource.query(COUNT_SQL, params),
      this.dataSource.query(pageSql(filters.order), [
        ...params,
        filters.limit,
        (filters.page - 1) * filters.limit,
      ]),
    ]);

    const total = Number(summary.total);
    const totalPages = Math.ceil(total / filters.limit) || 1;
    return {
      weekStart: summary.week_start,
      weekEnd: summary.week_end,
      data: rows.map(toRow),
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasNextPage: filters.page < totalPages,
        hasPreviousPage: filters.page > 1,
      },
    };
  }
}
