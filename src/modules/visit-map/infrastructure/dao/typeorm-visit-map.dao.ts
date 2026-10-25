import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VisitMapDao } from '../../domain/dao/visit-map.dao.js';
import {
  BUSINESS_TIMEZONE,
  VisitMapDay,
  VisitMapFilters,
  VisitMapRow,
} from '../../domain/visit-map.js';

/** $1 = timezone, $2 = day (or null for today in Bogotá). */
const DAY_SQL = `SELECT to_char(COALESCE($2::date, (now() AT TIME ZONE $1)::date), 'YYYY-MM-DD') AS day`;

/**
 * $3 = zone, $4 = advisor (null = no filter). The day is
 * [00:00, next day 00:00) in Bogotá time. The coordinates are the client's;
 * out-of-range values come back as null, never replaced. The territory is
 * the client's zone, as in HU-35, HU-37 and HU-40.
 */
const VISITS_SQL = `
  WITH day AS (
    SELECT d::timestamp AT TIME ZONE $1 AS starts_at,
           (d + 1)::timestamp AT TIME ZONE $1 AS ends_at
      FROM (SELECT COALESCE($2::date, (now() AT TIME ZONE $1)::date) AS d) AS requested
  )
  SELECT v.id, v.scheduled_at, v.status, v.order_generated,
         c.latitude BETWEEN -90 AND 90 AND c.longitude BETWEEN -180 AND 180 AS has_location,
         c.latitude, c.longitude,
         c.id AS client_id, c.commercial_name, c.address, c.municipality,
         z.id AS zone_id, z.name AS zone_name,
         v.advisor_id, u.name AS advisor_name,
         r.id AS route_id, r.name AS route_name
    FROM visits v
    JOIN day ON v.scheduled_at >= day.starts_at AND v.scheduled_at < day.ends_at
    JOIN clients c ON c.id = v.client_id
    JOIN zones z ON z.id = c.zone_id
    LEFT JOIN "user" u ON u.id = v.advisor_id
    LEFT JOIN routes r ON r.id = v.route_id
   WHERE ($3::int IS NULL OR c.zone_id = $3)
     AND ($4::int IS NULL OR v.advisor_id = $4)
   ORDER BY v.scheduled_at ASC, v.id ASC`;

const toRow = (row: any): VisitMapRow => ({
  visitId: Number(row.id),
  scheduledAt: row.scheduled_at,
  status: row.status,
  orderGenerated: row.order_generated,
  // has_location is null when a coordinate is missing, false when out of range.
  location: row.has_location
    ? { latitude: Number(row.latitude), longitude: Number(row.longitude) }
    : null,
  client: {
    id: Number(row.client_id),
    commercialName: row.commercial_name,
    address: row.address,
    municipality: row.municipality,
  },
  zone: { id: Number(row.zone_id), name: row.zone_name },
  advisor: { id: Number(row.advisor_id), name: row.advisor_name },
  route:
    row.route_id === null
      ? null
      : { id: Number(row.route_id), name: row.route_name },
});

@Injectable()
export class TypeOrmVisitMapDao implements VisitMapDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findDayVisits(filters: VisitMapFilters): Promise<VisitMapDay> {
    const dayParams = [BUSINESS_TIMEZONE, filters.date ?? null];
    const [[day], rows] = await Promise.all([
      this.dataSource.query(DAY_SQL, dayParams),
      this.dataSource.query(VISITS_SQL, [
        ...dayParams,
        filters.territoryId ?? null,
        filters.advisorId ?? null,
      ]),
    ]);
    return { date: day.day, rows: rows.map(toRow) };
  }
}
