import type { VisitMapDay, VisitMapFilters } from '../visit-map.js';

/** Read-only query for the visits map (HU-36). */
export abstract class VisitMapDao {
  abstract findDayVisits(filters: VisitMapFilters): Promise<VisitMapDay>;
}
