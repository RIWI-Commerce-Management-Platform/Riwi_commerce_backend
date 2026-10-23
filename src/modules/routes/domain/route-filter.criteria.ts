import { DayOfWeek } from './day-of-week.enum.js';
import { RouteFrequency } from './route-frequency.enum.js';
import { RouteStatus } from './route-status.enum.js';

/**
 * Criterios de filtrado dinámico para la consulta y listado de rutas comerciales (HU-21).
 * 
 * En mi panel de control como Director Regional, utilizo estos filtros para supervisar
 * las rutas por asesor, zona geográfica, estado operativo o día de la semana.
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
