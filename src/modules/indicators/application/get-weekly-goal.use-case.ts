import { Injectable } from '@nestjs/common';
import { IndicatorsDao } from '../domain/indicators.dao.js';
import { effectiveness } from './effectiveness.js';

export interface WeeklyGoalProgress {
  weekStart: Date;
  weekEnd: Date;
  /** Visits to complete this week. */
  goal: number;
  /** Where the goal comes from: the advisor profile or the scheduled visits. */
  goalSource: 'advisor' | 'scheduled';
  scheduled: number;
  completed: number;
  /** Completed over goal, capped at 100, for the progress bar. */
  percentage: number;
}

/**
 * HU-39: weekly goal widget of the sidebar. The goal is the advisor's
 * `weeklyVisitGoal` (set by an admin, HU-07); without one it falls back to
 * the visits scheduled for the week.
 */
@Injectable()
export class GetWeeklyGoalUseCase {
  constructor(private readonly indicatorsDao: IndicatorsDao) {}

  async execute(
    advisorId: number,
    reference = new Date(),
  ): Promise<WeeklyGoalProgress> {
    const weekStart = new Date(reference);
    weekStart.setDate(reference.getDate() - ((reference.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setMilliseconds(-1);

    const [configuredGoal, counts] = await Promise.all([
      this.indicatorsDao.findWeeklyVisitGoal(advisorId),
      this.indicatorsDao.countVisits(advisorId, {
        startDate: weekStart,
        endDate: weekEnd,
      }),
    ]);

    const goal = configuredGoal ?? counts.scheduled;
    return {
      weekStart,
      weekEnd,
      goal,
      goalSource: configuredGoal === null ? 'scheduled' : 'advisor',
      scheduled: counts.scheduled,
      completed: counts.completed,
      percentage: Math.min(100, effectiveness(counts.completed, goal)),
    };
  }
}
