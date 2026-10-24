import { DayOfWeek } from './day-of-week.enum.js';
import { RouteFrequency } from './route-frequency.enum.js';
import { RouteStatus } from './route-status.enum.js';

/**
 * Filters for the paginated route list (HU-21): a regional director
 * supervises routes by advisor, zone, status or day of the week.
 */
export interface RouteFilterCriteria {
  zoneId?: number;
  advisorId?: number;
  status?: RouteStatus;
  dayOfWeek?: DayOfWeek;
  frequency?: RouteFrequency;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
