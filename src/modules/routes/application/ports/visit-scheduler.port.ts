import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';

/**
 * Detalle de cada parada de cliente para programar en la agenda.
 */
export interface ScheduledStopItem {
  clientId: number;
  visitOrder: number;
  suggestedTime: string | null;
  estimatedDurationMinutes: number;
}

/**
 * Parámetros de comando para la generación automática de visitas programadas (HU-20).
 */
export interface ScheduleVisitsCommand {
  routeId: number;
  advisorId: number;
  dayOfWeek: DayOfWeek;
  frequency: RouteFrequency;
  startDate: Date;
  endDate?: Date | null;
  stops: ScheduledStopItem[];
}

/**
 * Puerto abstracto para la programación automática de visitas comerciales (HU-20).
 *
 * En mi diseño, este puerto representa el contrato de integración con el módulo
 * de Visitas de Camilo (Épica E4). Al asignar una ruta a un asesor comercial,
 * invoco este método para crear las visitas en estado PENDING según el día y frecuencia.
 */
export abstract class VisitSchedulerPort {
  /**
   * Con este método genero las visitas programadas en la agenda del asesor.
   * Reemplaza las visitas PENDING que la ruta ya tuviera (reasignación).
   * Retorna la cantidad de visitas creadas en base de datos.
   */
  abstract scheduleVisitsForRoute(
    command: ScheduleVisitsCommand,
  ): Promise<number>;
}
