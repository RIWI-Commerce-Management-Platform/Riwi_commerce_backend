import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ClientReportRow,
  OrderReportRow,
  QuoteReportRow,
  ReportFilters,
  ReportsDao,
  VisitReportRow,
} from '../domain/reports.dao.js';
import { SqlConditions } from '../../../shared/database/sql-conditions.js';

/** Hard cap so a single export can't exhaust memory. */
const MAX_ROWS = 50_000;

/** Read-only SQL over the tables of the other modules (HU-38). */
@Injectable()
export class TypeOrmReportsDao implements ReportsDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findVisits(filters: ReportFilters): Promise<VisitReportRow[]> {
    const conditions = new SqlConditions()
      .add('v.scheduled_at >= ?', filters.startDate)
      .add('v.scheduled_at <= ?', filters.endDate)
      .add('v.advisor_id = ?', filters.advisorId)
      .add('v.client_id = ?', filters.clientId)
      .add('c.zone_id = ?', filters.zoneId)
      .add('v.status = ?', filters.status);

    const rows = await this.dataSource.query(
      `SELECT v.id, v.scheduled_at, v.status, u.name AS advisor_name,
              c.nit AS client_nit, c.commercial_name AS client_name,
              z.name AS zone_name, v.actual_date::text AS actual_date,
              v.start_time::text AS start_time, v.end_time::text AS end_time,
              v.observations, v.quote_generated, v.order_generated,
              (SELECT string_agg(r.name, ' | ' ORDER BY r.name)
                 FROM visit_result_links l
                 JOIN visit_results r ON r.id = l.result_id
                WHERE l.visit_id = v.id) AS results
         FROM visits v
         JOIN clients c ON c.id = v.client_id
         LEFT JOIN zones z ON z.id = c.zone_id
         LEFT JOIN "user" u ON u.id = v.advisor_id
         ${conditions.where()}
        ORDER BY v.scheduled_at DESC
        LIMIT ${MAX_ROWS}`,
      conditions.params,
    );

    return rows.map((row: any) => ({
      id: Number(row.id),
      scheduledAt: new Date(row.scheduled_at),
      status: row.status,
      advisorName: row.advisor_name,
      clientNit: row.client_nit,
      clientName: row.client_name,
      zoneName: row.zone_name,
      actualDate: row.actual_date,
      startTime: row.start_time,
      endTime: row.end_time,
      results: row.results,
      observations: row.observations,
      quoteGenerated: Boolean(row.quote_generated),
      orderGenerated: Boolean(row.order_generated),
    }));
  }

  async findClients(filters: ReportFilters): Promise<ClientReportRow[]> {
    const search = filters.search?.trim()
      ? `%${filters.search.trim().toLowerCase()}%`
      : undefined;
    const conditions = new SqlConditions()
      .add(
        '(LOWER(c.nit) LIKE ? OR LOWER(c.business_name) LIKE ? OR LOWER(c.commercial_name) LIKE ?)',
        search,
      )
      .add('c.zone_id = ?', filters.zoneId)
      .add('c.client_type_id = ?', filters.clientTypeId)
      .add('c.potential_id = ?', filters.potentialId)
      .add(
        'LOWER(c.municipality) = LOWER(?)',
        filters.municipality?.trim() || undefined,
      )
      .add('c.is_active = ?', filters.isActive);

    const rows = await this.dataSource.query(
      `SELECT c.id, c.nit, c.business_name, c.commercial_name, c.address,
              c.neighborhood, c.municipality, c.department, c.phone, c.email,
              z.name AS zone_name, ct.name AS client_type, p.name AS potential,
              cs.name AS client_status, c.visit_frequency_days, c.latitude,
              c.longitude, c.is_active, c.created_at
         FROM clients c
         LEFT JOIN zones z ON z.id = c.zone_id
         LEFT JOIN client_types ct ON ct.id = c.client_type_id
         LEFT JOIN potentials p ON p.id = c.potential_id
         LEFT JOIN client_statuses cs ON cs.id = c.client_status_id
         ${conditions.where()}
        ORDER BY c.commercial_name ASC
        LIMIT ${MAX_ROWS}`,
      conditions.params,
    );

    return rows.map((row: any) => ({
      id: Number(row.id),
      nit: row.nit,
      businessName: row.business_name,
      commercialName: row.commercial_name,
      address: row.address,
      neighborhood: row.neighborhood,
      municipality: row.municipality,
      department: row.department,
      phone: row.phone,
      email: row.email,
      zoneName: row.zone_name,
      clientType: row.client_type,
      potential: row.potential,
      clientStatus: row.client_status,
      visitFrequencyDays: Number(row.visit_frequency_days),
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
    }));
  }

  async findQuotes(filters: ReportFilters): Promise<QuoteReportRow[]> {
    const conditions = this.commercialConditions('q', filters);

    const rows = await this.dataSource.query(
      `SELECT q.quote_number, q.created_at, q.status, c.nit AS client_nit,
              c.commercial_name AS client_name, z.name AS zone_name,
              u.name AS advisor_name, q.subtotal, q.total, q.visit_id,
              (SELECT COUNT(*) FROM quote_items i WHERE i.quote_id = q.id) AS items_count
         FROM quotes q
         JOIN clients c ON c.id = q.client_id
         LEFT JOIN zones z ON z.id = c.zone_id
         LEFT JOIN "user" u ON u.id = q.advisor_id
         ${conditions.where()}
        ORDER BY q.created_at DESC
        LIMIT ${MAX_ROWS}`,
      conditions.params,
    );

    return rows.map((row: any) => ({
      quoteNumber: row.quote_number,
      createdAt: new Date(row.created_at),
      status: row.status,
      clientNit: row.client_nit,
      clientName: row.client_name,
      zoneName: row.zone_name,
      advisorName: row.advisor_name,
      itemsCount: Number(row.items_count),
      subtotal: Number(row.subtotal),
      total: Number(row.total),
      visitId: row.visit_id === null ? null : Number(row.visit_id),
    }));
  }

  async findOrders(filters: ReportFilters): Promise<OrderReportRow[]> {
    const conditions = this.commercialConditions('o', filters);

    const rows = await this.dataSource.query(
      `SELECT o.order_number, o.created_at, o.status, q.quote_number,
              c.nit AS client_nit, c.commercial_name AS client_name,
              z.name AS zone_name, u.name AS advisor_name, o.total
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         LEFT JOIN quotes q ON q.id = o.quote_id
         LEFT JOIN zones z ON z.id = c.zone_id
         LEFT JOIN "user" u ON u.id = o.advisor_id
         ${conditions.where()}
        ORDER BY o.created_at DESC
        LIMIT ${MAX_ROWS}`,
      conditions.params,
    );

    return rows.map((row: any) => ({
      orderNumber: row.order_number,
      createdAt: new Date(row.created_at),
      status: row.status,
      quoteNumber: row.quote_number,
      clientNit: row.client_nit,
      clientName: row.client_name,
      zoneName: row.zone_name,
      advisorName: row.advisor_name,
      total: Number(row.total),
    }));
  }

  private commercialConditions(
    alias: string,
    filters: ReportFilters,
  ): SqlConditions {
    return new SqlConditions()
      .add(`${alias}.created_at >= ?`, filters.startDate)
      .add(`${alias}.created_at <= ?`, filters.endDate)
      .add(`${alias}.advisor_id = ?`, filters.advisorId)
      .add(`${alias}.client_id = ?`, filters.clientId)
      .add('c.zone_id = ?', filters.zoneId)
      .add(`${alias}.status = ?`, filters.status);
  }
}
