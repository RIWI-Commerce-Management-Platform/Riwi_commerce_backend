/** Filters shared by the CSV exports; each report uses the ones it supports. */
export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  zoneId?: number;
  advisorId?: number;
  clientId?: number;
  status?: string;
  search?: string;
  clientTypeId?: number;
  potentialId?: number;
  municipality?: string;
  isActive?: boolean;
}

export interface VisitReportRow {
  id: number;
  scheduledAt: Date;
  status: string;
  advisorName: string | null;
  clientNit: string;
  clientName: string;
  zoneName: string | null;
  actualDate: string | null;
  startTime: string | null;
  endTime: string | null;
  results: string | null;
  observations: string | null;
  quoteGenerated: boolean;
  orderGenerated: boolean;
}

export interface ClientReportRow {
  id: number;
  nit: string;
  businessName: string;
  commercialName: string;
  address: string;
  neighborhood: string;
  municipality: string;
  department: string;
  phone: string;
  email: string;
  zoneName: string | null;
  clientType: string | null;
  potential: string | null;
  clientStatus: string | null;
  visitFrequencyDays: number;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface QuoteReportRow {
  quoteNumber: string;
  createdAt: Date;
  status: string;
  clientNit: string;
  clientName: string;
  zoneName: string | null;
  advisorName: string | null;
  itemsCount: number;
  subtotal: number;
  total: number;
  visitId: number | null;
}

export interface OrderReportRow {
  orderNumber: string;
  createdAt: Date;
  status: string;
  quoteNumber: string | null;
  clientNit: string;
  clientName: string;
  zoneName: string | null;
  advisorName: string | null;
  total: number;
}

/** Read-only queries behind the CSV exports (HU-38). */
export abstract class ReportsDao {
  abstract findVisits(filters: ReportFilters): Promise<VisitReportRow[]>;
  abstract findClients(filters: ReportFilters): Promise<ClientReportRow[]>;
  abstract findQuotes(filters: ReportFilters): Promise<QuoteReportRow[]>;
  abstract findOrders(filters: ReportFilters): Promise<OrderReportRow[]>;
}
