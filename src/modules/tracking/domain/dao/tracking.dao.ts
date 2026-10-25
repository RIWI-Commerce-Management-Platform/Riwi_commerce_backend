import type { TrackingFilters, TrackingVisitsPage } from '../tracking-visit.js';

/** Read-only queries for the route and visit tracking table (HU-37). */
export abstract class TrackingDao {
  abstract findVisits(filters: TrackingFilters): Promise<TrackingVisitsPage>;
}
