import { describe, expect, it, vi } from 'vitest';
import { TypeOrmVisitSchedulerAdapter } from './typeorm-visit-scheduler.adapter.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { Repository } from 'typeorm';
import { VisitOrmEntity } from '../../visit/infrastructure/visit.orm-entity.js';

describe('TypeOrmVisitSchedulerAdapter', () => {
  const createMockVisitRepo = () => {
    return {
      save: vi.fn().mockImplementation((visits) => Promise.resolve(visits)),
      delete: vi.fn().mockResolvedValue({ affected: 0 }),
    } as unknown as Repository<VisitOrmEntity>;
  };

  it('should return 0 if there are no stops to schedule', async () => {
    const repo = createMockVisitRepo();
    const adapter = new TypeOrmVisitSchedulerAdapter(repo);

    const count = await adapter.scheduleVisitsForRoute({
      routeId: 1,
      advisorId: 5,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
      stops: [],
    });

    expect(count).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should generate and save visits in database according to day and frequency', async () => {
    const repo = createMockVisitRepo();
    const adapter = new TypeOrmVisitSchedulerAdapter(repo);

    const count = await adapter.scheduleVisitsForRoute({
      routeId: 10,
      advisorId: 7,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
      endDate: new Date('2026-11-09'), // spans 3 Mondays: Oct 26, Nov 2, Nov 9
      stops: [
        {
          clientId: 101,
          visitOrder: 1,
          suggestedTime: '09:00:00',
          estimatedDurationMinutes: 30,
        },
        {
          clientId: 102,
          visitOrder: 2,
          suggestedTime: '10:00:00',
          estimatedDurationMinutes: 45,
        },
      ],
    });

    expect(count).toBeGreaterThan(0);
    expect(repo.save).toHaveBeenCalled();

    const savedVisits = vi.mocked(repo.save).mock
      .calls[0][0] as VisitOrmEntity[];
    expect(savedVisits[0].advisorId).toBe(7);
    expect(savedVisits[0].routeId).toBe(10);
    expect(savedVisits[0].status).toBe('PENDING');
  });

  it('should discard the route pending visits before scheduling (reassignment)', async () => {
    const repo = createMockVisitRepo();
    const adapter = new TypeOrmVisitSchedulerAdapter(repo);

    await adapter.scheduleVisitsForRoute({
      routeId: 3,
      advisorId: 8,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
      stops: [],
    });

    expect(repo.delete).toHaveBeenCalledWith({ routeId: 3, status: 'PENDING' });
  });

  it.each([
    [DayOfWeek.SUNDAY, 0],
    [DayOfWeek.TUESDAY, 2],
    [DayOfWeek.WEDNESDAY, 3],
    [DayOfWeek.THURSDAY, 4],
    [DayOfWeek.FRIDAY, 5],
    [DayOfWeek.SATURDAY, 6],
  ])('should schedule the first visit on %s', async (dayOfWeek, dayIndex) => {
    const repo = createMockVisitRepo();
    const adapter = new TypeOrmVisitSchedulerAdapter(repo);

    await adapter.scheduleVisitsForRoute({
      routeId: 1,
      advisorId: 5,
      dayOfWeek,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26T00:00:00Z'),
      stops: [
        {
          clientId: 1,
          visitOrder: 1,
          suggestedTime: null,
          estimatedDurationMinutes: 30,
        },
      ],
    });

    const saved = vi.mocked(repo.save).mock.calls[0][0] as VisitOrmEntity[];
    expect(saved[0].scheduledAt.getUTCDay()).toBe(dayIndex);
    // Without a suggested time the visit defaults to 09:00 UTC
    expect(saved[0].scheduledAt.getUTCHours()).toBe(9);
  });

  it.each([
    [RouteFrequency.BIWEEKLY, 14, 4], // Oct 26, Nov 9, Nov 23, Dec 7 (end date inclusive)
    [RouteFrequency.MONTHLY, 28, 2],
  ])(
    'should step %s visits every %i days until the end date',
    async (frequency, stepDays, expectedVisits) => {
      const repo = createMockVisitRepo();
      const adapter = new TypeOrmVisitSchedulerAdapter(repo);

      const count = await adapter.scheduleVisitsForRoute({
        routeId: 1,
        advisorId: 5,
        dayOfWeek: DayOfWeek.MONDAY,
        frequency,
        startDate: new Date('2026-10-26T00:00:00Z'),
        endDate: new Date('2026-12-07T00:00:00Z'),
        stops: [
          {
            clientId: 1,
            visitOrder: 1,
            suggestedTime: '14:30',
            estimatedDurationMinutes: 30,
          },
        ],
      });

      const saved = vi.mocked(repo.save).mock.calls[0][0] as VisitOrmEntity[];
      expect(count).toBe(expectedVisits);
      const gapMs =
        saved[1].scheduledAt.getTime() - saved[0].scheduledAt.getTime();
      expect(gapMs).toBe(stepDays * 24 * 60 * 60 * 1000);
      expect(saved[0].scheduledAt.getUTCHours()).toBe(14);
      expect(saved[0].scheduledAt.getUTCMinutes()).toBe(30);
    },
  );

  it('saves nothing when the date range has no matching day', async () => {
    const repo = createMockVisitRepo();

    const count = await new TypeOrmVisitSchedulerAdapter(
      repo,
    ).scheduleVisitsForRoute({
      routeId: 1,
      advisorId: 5,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-27'), // Tuesday
      endDate: new Date('2026-10-30'), // Friday, no Monday in between
      stops: [
        {
          clientId: 101,
          visitOrder: 1,
          suggestedTime: null,
          estimatedDurationMinutes: 30,
        },
      ],
    });

    expect(count).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('falls back to 9:00 for an unreadable suggested time', async () => {
    const repo = createMockVisitRepo();

    await new TypeOrmVisitSchedulerAdapter(repo).scheduleVisitsForRoute({
      routeId: 1,
      advisorId: 5,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.WEEKLY,
      startDate: new Date('2026-10-26'),
      endDate: new Date('2026-10-26'),
      stops: [
        {
          clientId: 101,
          visitOrder: 1,
          suggestedTime: 'later',
          estimatedDurationMinutes: 30,
        },
      ],
    });

    const [visit] = vi.mocked(repo.save).mock.calls[0][0] as VisitOrmEntity[];
    expect(visit.scheduledAt.getUTCHours()).toBe(9);
    expect(visit.scheduledAt.getUTCMinutes()).toBe(0);
  });
});
