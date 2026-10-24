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

  it('should support BIWEEKLY frequency and handle null suggestedTime', async () => {
    const repo = createMockVisitRepo();
    const adapter = new TypeOrmVisitSchedulerAdapter(repo);

    const count = await adapter.scheduleVisitsForRoute({
      routeId: 10,
      advisorId: 7,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.BIWEEKLY,
      startDate: new Date('2026-10-26'),
      endDate: new Date('2026-11-23'),
      stops: [
        {
          clientId: 101,
          visitOrder: 1,
          suggestedTime: null,
          estimatedDurationMinutes: 30,
        },
      ],
    });

    expect(count).toBeGreaterThan(0);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should support MONTHLY frequency', async () => {
    const repo = createMockVisitRepo();
    const adapter = new TypeOrmVisitSchedulerAdapter(repo);

    const count = await adapter.scheduleVisitsForRoute({
      routeId: 10,
      advisorId: 7,
      dayOfWeek: DayOfWeek.MONDAY,
      frequency: RouteFrequency.MONTHLY,
      startDate: new Date('2026-10-26'),
      endDate: new Date('2026-12-21'),
      stops: [
        {
          clientId: 101,
          visitOrder: 1,
          suggestedTime: '14:30:00',
          estimatedDurationMinutes: 30,
        },
      ],
    });

    expect(count).toBeGreaterThan(0);
    expect(repo.save).toHaveBeenCalled();
  });
});
