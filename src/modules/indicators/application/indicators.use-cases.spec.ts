import { describe, expect, it, vi } from 'vitest';
import { GetWeeklyGoalUseCase } from './get-weekly-goal.use-case.js';
import { GetIndicatorsUseCase } from './get-indicators.use-case.js';
import { effectiveness } from './effectiveness.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

const metrics = {
  scheduledVisits: 8,
  completedVisits: 6,
  quotesCount: 2,
  quotedValue: 1500,
  ordersCount: 1,
  orderedValue: 700,
};

const buildDao = () => ({
  findWeeklyVisitGoal: vi.fn().mockResolvedValue(null),
  countVisits: vi.fn().mockResolvedValue({ scheduled: 10, completed: 4 }),
  metricsByAdvisor: vi
    .fn()
    .mockResolvedValue([
      { advisorId: 5, advisorName: 'Laura', zoneId: 1, ...metrics },
    ]),
  metricsByZone: vi
    .fn()
    .mockResolvedValue([{ zoneId: 1, zoneName: 'Soledad', ...metrics }]),
});

describe('effectiveness', () => {
  it('is the completed share with one decimal and 0 without visits', () => {
    expect(effectiveness(2, 3)).toBe(66.7);
    expect(effectiveness(0, 0)).toBe(0);
  });
});

describe('GetWeeklyGoalUseCase (HU-39)', () => {
  // Wednesday 21 October 2026
  const reference = new Date(2026, 9, 21, 15, 0, 0);

  it('falls back to the scheduled visits of the week', async () => {
    const dao = buildDao();
    const progress = await new GetWeeklyGoalUseCase(dao as any).execute(
      5,
      reference,
    );

    expect(progress).toMatchObject({
      goal: 10,
      goalSource: 'scheduled',
      completed: 4,
      percentage: 40,
    });
    expect(progress.weekStart).toEqual(new Date(2026, 9, 19, 0, 0, 0, 0));
    expect(progress.weekEnd).toEqual(new Date(2026, 9, 25, 23, 59, 59, 999));
    expect(dao.countVisits).toHaveBeenCalledWith(5, {
      startDate: progress.weekStart,
      endDate: progress.weekEnd,
    });
  });

  it("uses the advisor's goal and caps the bar at 100", async () => {
    const dao = buildDao();
    dao.findWeeklyVisitGoal.mockResolvedValue(3);

    const progress = await new GetWeeklyGoalUseCase(dao as any).execute(
      5,
      reference,
    );

    expect(progress).toMatchObject({
      goal: 3,
      goalSource: 'advisor',
      percentage: 100,
    });
  });

  it('reports 0% when there is nothing to do', async () => {
    const dao = buildDao();
    dao.countVisits.mockResolvedValue({ scheduled: 0, completed: 0 });

    const progress = await new GetWeeklyGoalUseCase(dao as any).execute(
      5,
      reference,
    );

    expect(progress.percentage).toBe(0);
  });
});

describe('GetIndicatorsUseCase (HU-40)', () => {
  const range = {
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 9, 31),
  };

  it('adds the effectiveness per advisor and keeps the admin filter', async () => {
    const dao = buildDao();
    const rows = await new GetIndicatorsUseCase(dao as any).byAdvisor(
      { ...range, zoneId: 2 },
      { id: 1, role: UserRole.ADMIN, zoneId: null },
    );

    expect(rows[0].effectiveness).toBe(75);
    expect(dao.metricsByAdvisor).toHaveBeenCalledWith(
      { ...range, zoneId: 2 },
      2,
    );
  });

  it('forces the zone of a regional director', async () => {
    const dao = buildDao();
    await new GetIndicatorsUseCase(dao as any).byZone(
      { ...range, zoneId: 2 },
      { id: 3, role: UserRole.DIRECTOR_REGIONAL, zoneId: 7 },
    );

    expect(dao.metricsByZone).toHaveBeenCalledWith({ ...range, zoneId: 2 }, 7);
  });

  it('returns every zone without a filter', async () => {
    const dao = buildDao();
    const rows = await new GetIndicatorsUseCase(dao as any).byZone(range);

    expect(rows[0]).toMatchObject({ zoneName: 'Soledad', effectiveness: 75 });
    expect(dao.metricsByZone).toHaveBeenCalledWith(range, undefined);
  });
});
