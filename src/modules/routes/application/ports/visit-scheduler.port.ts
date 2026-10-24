import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';

/**
 * A client stop to schedule in the agenda.
 */
export interface ScheduledStopItem {
  clientId: number;
  visitOrder: number;
  suggestedTime: string | null;
  estimatedDurationMinutes: number;
}

/**
 * Input to generate the scheduled visits of a route (HU-20).
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
 * Port that schedules the visits of a route (HU-20); the contract with the
 * visits module (epic E4). When a route is assigned, it creates PENDING
 * visits for the route's day and frequency.
 */
export abstract class VisitSchedulerPort {
  /**
   * Creates the visits in the advisor's agenda, replacing the route's
   * PENDING visits (reassignment). Returns how many visits were created.
   */
  abstract scheduleVisitsForRoute(
    command: ScheduleVisitsCommand,
  ): Promise<number>;
}
