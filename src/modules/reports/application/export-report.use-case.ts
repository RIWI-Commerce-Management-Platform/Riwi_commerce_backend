import { Injectable } from '@nestjs/common';
import {
  ClientReportRow,
  OrderReportRow,
  QuoteReportRow,
  ReportFilters,
  ReportsDao,
  VisitReportRow,
} from '../domain/reports.dao.js';
import { CsvSeparator, CsvValue, toCsv } from './csv.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

export type ReportType = 'visits' | 'clients' | 'quotes' | 'orders';

export interface ExportedReport {
  filename: string;
  content: string;
}

interface ReportDefinition<Row> {
  load: (dao: ReportsDao, filters: ReportFilters) => Promise<Row[]>;
  headers: string[];
  toRow: (row: Row) => CsvValue[];
}

const REPORTS: { [K in ReportType]: ReportDefinition<any> } = {
  visits: {
    load: (dao, filters) => dao.findVisits(filters),
    headers: [
      'Visit ID',
      'Scheduled at',
      'Status',
      'Advisor',
      'Client NIT',
      'Client',
      'Zone',
      'Actual date',
      'Start time',
      'End time',
      'Results',
      'Observations',
      'Quote generated',
      'Order generated',
    ],
    toRow: (row: VisitReportRow) => [
      row.id,
      row.scheduledAt,
      row.status,
      row.advisorName,
      row.clientNit,
      row.clientName,
      row.zoneName,
      row.actualDate,
      row.startTime,
      row.endTime,
      row.results,
      row.observations,
      row.quoteGenerated,
      row.orderGenerated,
    ],
  } satisfies ReportDefinition<VisitReportRow>,
  clients: {
    load: (dao, filters) => dao.findClients(filters),
    headers: [
      'Client ID',
      'NIT',
      'Business name',
      'Commercial name',
      'Address',
      'Neighborhood',
      'Municipality',
      'Department',
      'Phone',
      'Email',
      'Zone',
      'Client type',
      'Potential',
      'Client status',
      'Visit frequency (days)',
      'Latitude',
      'Longitude',
      'Active',
      'Created at',
    ],
    toRow: (row: ClientReportRow) => [
      row.id,
      row.nit,
      row.businessName,
      row.commercialName,
      row.address,
      row.neighborhood,
      row.municipality,
      row.department,
      row.phone,
      row.email,
      row.zoneName,
      row.clientType,
      row.potential,
      row.clientStatus,
      row.visitFrequencyDays,
      row.latitude,
      row.longitude,
      row.isActive,
      row.createdAt,
    ],
  } satisfies ReportDefinition<ClientReportRow>,
  quotes: {
    load: (dao, filters) => dao.findQuotes(filters),
    headers: [
      'Quote number',
      'Created at',
      'Status',
      'Client NIT',
      'Client',
      'Zone',
      'Advisor',
      'Items',
      'Subtotal',
      'Total',
      'Visit ID',
    ],
    toRow: (row: QuoteReportRow) => [
      row.quoteNumber,
      row.createdAt,
      row.status,
      row.clientNit,
      row.clientName,
      row.zoneName,
      row.advisorName,
      row.itemsCount,
      row.subtotal,
      row.total,
      row.visitId,
    ],
  } satisfies ReportDefinition<QuoteReportRow>,
  orders: {
    load: (dao, filters) => dao.findOrders(filters),
    headers: [
      'Order number',
      'Created at',
      'Status',
      'Quote number',
      'Client NIT',
      'Client',
      'Zone',
      'Advisor',
      'Total',
    ],
    toRow: (row: OrderReportRow) => [
      row.orderNumber,
      row.createdAt,
      row.status,
      row.quoteNumber,
      row.clientNit,
      row.clientName,
      row.zoneName,
      row.advisorName,
      row.total,
    ],
  } satisfies ReportDefinition<OrderReportRow>,
};

/**
 * HU-38: exports visits, clients, quotes or orders to CSV with the filters
 * active in the frontend. A regional director only exports their zone.
 */
@Injectable()
export class ExportReportUseCase {
  constructor(private readonly reportsDao: ReportsDao) {}

  async execute(
    type: ReportType,
    filters: ReportFilters,
    actor?: CurrentActor,
    separator: CsvSeparator = ',',
    today = new Date(),
  ): Promise<ExportedReport> {
    const definition = REPORTS[type];
    const scoped = { ...filters, ...scopeForActor(actor) };
    const rows = await definition.load(this.reportsDao, scoped);

    return {
      filename: `${type}-${today.toISOString().slice(0, 10)}.csv`,
      content: toCsv(
        definition.headers,
        rows.map((row) => definition.toRow(row)),
        separator,
      ),
    };
  }
}
