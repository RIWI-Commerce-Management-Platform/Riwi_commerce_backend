
export interface DashboardKpis {
  scheduledVisits: number;
  completedVisits: number;
  effectiveness: number;
  quotedAmount: number;
  closedOrders: number;
  revenue: number;
}

export interface DashboardFilters {
  territoryId?: string;
  weekStart: string;
}
