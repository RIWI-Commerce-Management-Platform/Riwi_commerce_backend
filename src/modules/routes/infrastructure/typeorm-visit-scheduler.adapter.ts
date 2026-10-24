import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduleVisitsCommand,
  VisitSchedulerPort,
} from '../application/ports/visit-scheduler.port.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { VisitOrmEntity } from '../../visit/infrastructure/visit.orm-entity.js';

/**
 * VisitSchedulerPort implementation (HU-20), the integration with the
 * visits module (epic E4). When a route is assigned, it works out the dates
 * that match the route's day of the week and frequency and inserts PENDING
 * rows in `visits`, so they show up in the advisor's agenda right away.
 */
@Injectable()
export class TypeOrmVisitSchedulerAdapter implements VisitSchedulerPort {
  constructor(
    @InjectRepository(VisitOrmEntity)
    private readonly visitRepository: Repository<VisitOrmEntity>,
  ) {}

  /** Creates the scheduled visits in the `visits` table. */
  async scheduleVisitsForRoute(
    command: ScheduleVisitsCommand,
  ): Promise<number> {
    // On reassignment, drop the previous assignment's pending visits so the
    // agenda isn't duplicated. Visits already done are kept.
    await this.visitRepository.delete({
      routeId: command.routeId,
      status: 'PENDING',
    });

    if (command.stops.length === 0) {
      return 0;
    }

    const scheduledDates = this._computeScheduledDates(
      command.startDate,
      command.endDate,
      command.dayOfWeek,
      command.frequency,
    );

    const visitsToInsert: VisitOrmEntity[] = [];

    for (const date of scheduledDates) {
      for (const stop of command.stops) {
        const visit = new VisitOrmEntity();
        visit.clientId = stop.clientId;
        visit.advisorId = command.advisorId;
        visit.routeId = command.routeId;
        visit.scheduledAt = this._combineDateAndTime(date, stop.suggestedTime);
        visit.status = 'PENDING';
        visit.objective = `Visita programada de ruta (Parada #${stop.visitOrder})`;
        visit.observations = null;
        visit.actualDate = null;
        visit.startTime = null;
        visit.endTime = null;
        visitsToInsert.push(visit);
      }
    }

    if (visitsToInsert.length === 0) {
      return 0;
    }

    const saved = await this.visitRepository.save(visitsToInsert);
    return saved.length;
  }

  /** Calendar dates that match the day of the week and the frequency. */
  private _computeScheduledDates(
    startDate: Date,
    endDate: Date | null | undefined,
    dayOfWeek: DayOfWeek,
    frequency: RouteFrequency,
  ): Date[] {
    const targetDayIndex = this._mapDayOfWeekToIndex(dayOfWeek);
    const start = new Date(startDate);

    // Move the start date to the first matching day of the week
    while (start.getUTCDay() !== targetDayIndex) {
      start.setUTCDate(start.getUTCDate() + 1);
    }

    // Without an end date, schedule 4 weeks ahead
    const horizonLimit = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000);

    const stepDays = this._getFrequencyStepDays(frequency);
    const dates: Date[] = [];

    const current = new Date(start);
    while (current <= horizonLimit && dates.length < 12) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + stepDays);
    }

    return dates;
  }

  /** DayOfWeek -> JavaScript day index (0: Sunday, 1: Monday, ...). */
  private _mapDayOfWeekToIndex(day: DayOfWeek): number {
    switch (day) {
      case DayOfWeek.SUNDAY:
        return 0;
      case DayOfWeek.MONDAY:
        return 1;
      case DayOfWeek.TUESDAY:
        return 2;
      case DayOfWeek.WEDNESDAY:
        return 3;
      case DayOfWeek.THURSDAY:
        return 4;
      case DayOfWeek.FRIDAY:
        return 5;
      case DayOfWeek.SATURDAY:
        return 6;
    }
  }

  /** Days between runs for the frequency. */
  private _getFrequencyStepDays(frequency: RouteFrequency): number {
    switch (frequency) {
      case RouteFrequency.WEEKLY:
        return 7;
      case RouteFrequency.BIWEEKLY:
        return 14;
      case RouteFrequency.MONTHLY:
        return 28;
    }
  }

  /** Combines the scheduled date with the suggested time (e.g. '09:30:00'). */
  private _combineDateAndTime(date: Date, suggestedTime: string | null): Date {
    const combined = new Date(date);
    if (!suggestedTime) {
      combined.setUTCHours(9, 0, 0, 0); // Hora por defecto: 9:00 AM
      return combined;
    }

    const parts = suggestedTime.split(':').map((p) => Number.parseInt(p, 10));
    const hours = parts[0] || 9;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    combined.setUTCHours(hours, minutes, seconds, 0);
    return combined;
  }
}
