import type { PaginationMeta } from '../../../shared/pagination/paginated-result.interface.js';

/** The commercial week runs Monday to Sunday in Colombian time. */
export const BUSINESS_TIMEZONE = 'America/Bogota';

export type SortOrder = 'asc' | 'desc';

export interface TrackingFilters {
  /** Any day 'YYYY-MM-DD' of the week to show; defaults to the current week. */
  weekStart?: string;
  /** Zone (territory) of the client. */
  territoryId?: number;
  advisorId?: number;
  routeId?: number;
  /** A VisitStatus value. */
  status?: string;
  page: number;
  limit: number;
  /** By scheduled date. */
  order: SortOrder;
}

/** One row of the "Seguimiento de rutas y visitas" table: one visit. */
export interface TrackingVisitRow {
  visitId: number;
  scheduledAt: Date;
  /** 'YYYY-MM-DD' or null while the visit has not happened. */
  actualDate: string | null;
  status: string;
  quoteGenerated: boolean;
  orderGenerated: boolean;
  client: { id: number; commercialName: string };
  zone: { id: number; name: string };
  advisor: { id: number; name: string | null };
  route: { id: number; name: string } | null;
}

export interface TrackingVisitsPage {
  /** Monday of the week, 'YYYY-MM-DD'. */
  weekStart: string;
  /** Sunday of the week, 'YYYY-MM-DD'. */
  weekEnd: string;
  data: TrackingVisitRow[];
  meta: PaginationMeta;
}
