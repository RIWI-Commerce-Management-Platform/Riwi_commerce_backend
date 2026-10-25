import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AdvisorMetricsRow,
  CommercialMetrics,
  IndicatorRange,
  IndicatorsDao,
  WeeklyVisitCounts,
  ZoneMetricsRow,
} from '../domain/indicators.dao.js';
import { SqlConditions } from '../../../shared/database/sql-conditions.js';

/**
 * Per-group subqueries over visits, quotes and orders in the range ($1, $2).
 * Cancelled orders don't count as ordered value.
 */
const metricsSelect = (visitKey: string, commercialKey: string) => `
  (SELECT COUNT(*) FROM visits v JOIN clients c ON c.id = v.client_id
    WHERE ${visitKey} AND v.scheduled_at BETWEEN $1 AND $2) AS scheduled_visits,
  (SELECT COUNT(*) FROM visits v JOIN clients c ON c.id = v.client_id
    WHERE ${visitKey} AND v.scheduled_at BETWEEN $1 AND $2
      AND v.status = 'VISITED') AS completed_visits,
  (SELECT COUNT(*) FROM quotes q JOIN clients c ON c.id = q.client_id
    WHERE ${commercialKey.replaceAll('#', 'q')} AND q.created_at BETWEEN $1 AND $2) AS quotes_count,
  (SELECT COALESCE(SUM(q.total), 0) FROM quotes q JOIN clients c ON c.id = q.client_id
    WHERE ${commercialKey.replaceAll('#', 'q')} AND q.created_at BETWEEN $1 AND $2) AS quoted_value,
  (SELECT COUNT(*) FROM orders o JOIN clients c ON c.id = o.client_id
    WHERE ${commercialKey.replaceAll('#', 'o')} AND o.created_at BETWEEN $1 AND $2
      AND o.status <> 'CANCELLED') AS orders_count,
  (SELECT COALESCE(SUM(o.total), 0) FROM orders o JOIN clients c ON c.id = o.client_id
    WHERE ${commercialKey.replaceAll('#', 'o')} AND o.created_at BETWEEN $1 AND $2
      AND o.status <> 'CANCELLED') AS ordered_value`;

const toMetrics = (row: any): CommercialMetrics => ({
  scheduledVisits: Number(row.scheduled_visits),
  completedVisits: Number(row.completed_visits),
  quotesCount: Number(row.quotes_count),
  quotedValue: Number(row.quoted_value),
  ordersCount: Number(row.orders_count),
  orderedValue: Number(row.ordered_value),
});

@Injectable()
export class TypeOrmIndicatorsDao implements IndicatorsDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findWeeklyVisitGoal(advisorId: number): Promise<number | null> {
    const rows = await this.dataSource.query(
      'SELECT weekly_visit_goal FROM advisors WHERE user_id = $1',
      [advisorId],
    );
    const goal = rows[0]?.weekly_visit_goal;
    return goal === undefined || goal === null ? null : Number(goal);
  }

  async countVisits(
    advisorId: number,
    range: IndicatorRange,
  ): Promise<WeeklyVisitCounts> {
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*) AS scheduled,
              COUNT(*) FILTER (WHERE status = 'VISITED') AS completed
         FROM visits
        WHERE advisor_id = $1 AND scheduled_at BETWEEN $2 AND $3`,
      [advisorId, range.startDate, range.endDate],
    );
    return {
      scheduled: Number(row?.scheduled ?? 0),
      completed: Number(row?.completed ?? 0),
    };
  }

  async metricsByAdvisor(
    range: IndicatorRange,
    zoneId?: number,
  ): Promise<AdvisorMetricsRow[]> {
    const conditions = new SqlConditions([range.startDate, range.endDate]).add(
      'a.zone_id = ?',
      zoneId,
    );
    const rows = await this.dataSource.query(
      `SELECT u.id AS advisor_id, u.name AS advisor_name, a.zone_id,
              ${metricsSelect('v.advisor_id = u.id', '#.advisor_id = u.id')}
         FROM "user" u
         LEFT JOIN advisors a ON a.user_id = u.id
        WHERE u.role = 'ASESOR' ${conditions.and()}
        ORDER BY u.name ASC`,
      conditions.params,
    );
    return rows.map((row: any) => ({
      advisorId: Number(row.advisor_id),
      advisorName: row.advisor_name,
      zoneId: row.zone_id === null ? null : Number(row.zone_id),
      ...toMetrics(row),
    }));
  }

  async metricsByZone(
    range: IndicatorRange,
    zoneId?: number,
  ): Promise<ZoneMetricsRow[]> {
    const conditions = new SqlConditions([range.startDate, range.endDate]).add(
      'z.id = ?',
      zoneId,
    );
    const rows = await this.dataSource.query(
      `SELECT z.id AS zone_id, z.name AS zone_name,
              ${metricsSelect('c.zone_id = z.id', 'c.zone_id = z.id')}
         FROM zones z
        WHERE z.is_active = true ${conditions.and()}
        ORDER BY z.name ASC`,
      conditions.params,
    );
    return rows.map((row: any) => ({
      zoneId: Number(row.zone_id),
      zoneName: row.zone_name,
      ...toMetrics(row),
    }));
  }
}
