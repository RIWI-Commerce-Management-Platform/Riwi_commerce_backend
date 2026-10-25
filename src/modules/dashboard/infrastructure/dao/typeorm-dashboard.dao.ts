import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardDao } from '../../domain/dao/dashboard.dao.js';
import {
  BUSINESS_TIMEZONE,
  DashboardFilters,
  WeeklyMetrics,
} from '../../domain/dashboard-kpis.js';

/**
 * $1 = any day of the week (or null for today), $2 = zone id (or null for
 * every zone), $3 = business timezone.
 *
 * `week` turns the day into its Monday (date_trunc) and into the two
 * instants [Monday 00:00, next Monday 00:00) in Bogotá time. Each KPI is its
 * own subquery joined only to the client (many-to-one), so nothing is
 * counted twice. The territory is the client's zone, as in HU-40.
 */
const WEEKLY_METRICS_SQL = `
  WITH day AS (
    SELECT date_trunc('week', COALESCE($1::date, (now() AT TIME ZONE $3)::date))::date AS monday
  ), week AS (
    SELECT monday,
           monday::timestamp AT TIME ZONE $3 AS starts_at,
           (monday + 7)::timestamp AT TIME ZONE $3 AS ends_at
      FROM day
  )
  SELECT
    to_char(monday, 'YYYY-MM-DD') AS week_start,
    to_char(monday + 6, 'YYYY-MM-DD') AS week_end,
    (SELECT COUNT(*) FROM visits v JOIN clients c ON c.id = v.client_id
      WHERE v.scheduled_at >= starts_at AND v.scheduled_at < ends_at
        AND ($2::int IS NULL OR c.zone_id = $2)) AS scheduled_visits,
    -- Completed = VISITED, like HU-39/HU-40.
    (SELECT COUNT(*) FROM visits v JOIN clients c ON c.id = v.client_id
      WHERE v.scheduled_at >= starts_at AND v.scheduled_at < ends_at
        AND v.status = 'VISITED'
        AND ($2::int IS NULL OR c.zone_id = $2)) AS completed_visits,
    -- Every quote created in the week, like HU-40 (provisional).
    (SELECT COALESCE(SUM(q.total), 0)::numeric(18, 2)::text
       FROM quotes q JOIN clients c ON c.id = q.client_id
      WHERE q.created_at >= starts_at AND q.created_at < ends_at
        AND ($2::int IS NULL OR c.zone_id = $2)) AS quoted_amount,
    -- Provisional "closed order": created in the week and not cancelled.
    (SELECT COUNT(*) FROM orders o JOIN clients c ON c.id = o.client_id
      WHERE o.created_at >= starts_at AND o.created_at < ends_at
        AND o.status <> 'CANCELLED'
        AND ($2::int IS NULL OR c.zone_id = $2)) AS closed_orders
  FROM week`;

@Injectable()
export class TypeOrmDashboardDao implements DashboardDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getWeeklyMetrics(filters: DashboardFilters): Promise<WeeklyMetrics> {
    const [row] = await this.dataSource.query(WEEKLY_METRICS_SQL, [
      filters.weekStart ?? null,
      filters.territoryId ?? null,
      BUSINESS_TIMEZONE,
    ]);
    return {
      weekStart: row.week_start,
      weekEnd: row.week_end,
      scheduledVisits: Number(row.scheduled_visits),
      completedVisits: Number(row.completed_visits),
      quotedAmount: row.quoted_amount,
      closedOrders: Number(row.closed_orders),
    };
  }
}
