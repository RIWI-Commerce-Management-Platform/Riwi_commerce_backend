/**
 * The commercial week runs Monday 00:00 to Sunday 23:59 in Colombian time,
 * whatever the server or container timezone is.
 */
export const BUSINESS_TIMEZONE = 'America/Bogota';

export interface DashboardFilters {
  /** Any day 'YYYY-MM-DD' of the week to show; defaults to the current week. */
  weekStart?: string;
  /** Zone (territory) of the clients; every zone when undefined. */
  territoryId?: number;
}

/** What the DAO reads from PostgreSQL for one week. */
export interface WeeklyMetrics {
  /** Monday of the week, 'YYYY-MM-DD'. */
  weekStart: string;
  /** Sunday of the week, 'YYYY-MM-DD'. */
  weekEnd: string;
  scheduledVisits: number;
  completedVisits: number;
  /** Exact decimal as text, e.g. '2204000.00'. */
  quotedAmount: string;
  closedOrders: number;
}

/** The six HU-35 KPI cards of one week. */
export interface DashboardKpis extends WeeklyMetrics {
  /** null means every territory. */
  territoryId: number | null;
  /** Completed over scheduled visits, %, one decimal; null without visits. */
  effectiveness: number | null;
  /** Invoiced revenue: always null, the platform has no invoicing data yet. */
  revenue: string | null;
}
