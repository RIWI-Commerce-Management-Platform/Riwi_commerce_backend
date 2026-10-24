export interface IndicatorRange {
  startDate: Date;
  endDate: Date;
}

export interface WeeklyVisitCounts {
  scheduled: number;
  completed: number;
}

/** Raw commercial metrics of one advisor or one zone in a date range. */
export interface CommercialMetrics {
  scheduledVisits: number;
  completedVisits: number;
  quotesCount: number;
  quotedValue: number;
  ordersCount: number;
  orderedValue: number;
}

export interface AdvisorMetricsRow extends CommercialMetrics {
  advisorId: number;
  advisorName: string;
  zoneId: number | null;
}

export interface ZoneMetricsRow extends CommercialMetrics {
  zoneId: number;
  zoneName: string;
}

/** Read-only queries for the indicators (HU-39, HU-40). */
export abstract class IndicatorsDao {
  abstract findWeeklyVisitGoal(advisorId: number): Promise<number | null>;
  abstract countVisits(
    advisorId: number,
    range: IndicatorRange,
  ): Promise<WeeklyVisitCounts>;
  /** Advisors (users with the ASESOR role), optionally only of one zone. */
  abstract metricsByAdvisor(
    range: IndicatorRange,
    zoneId?: number,
  ): Promise<AdvisorMetricsRow[]>;
  /** Active zones, optionally only one; visits, quotes and orders by client zone. */
  abstract metricsByZone(
    range: IndicatorRange,
    zoneId?: number,
  ): Promise<ZoneMetricsRow[]>;
}
