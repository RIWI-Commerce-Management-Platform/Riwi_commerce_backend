import { describe, expect, it, vi } from 'vitest';
import { ListTrackingVisitsUseCase } from './list-tracking-visits.use-case.js';
import type { TrackingDao } from '../../domain/dao/tracking.dao.js';
import type { TrackingFilters } from '../../domain/tracking-visit.js';
import { UserRole } from '../../../auth/domain/user-role.enum.js';

const page = {
  weekStart: '2026-10-19',
  weekEnd: '2026-10-25',
  data: [],
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const filters: TrackingFilters = {
  weekStart: '2026-10-21',
  territoryId: 2,
  advisorId: 3,
  routeId: 4,
  status: 'VISITED',
  page: 2,
  limit: 5,
  order: 'desc',
};

const build = () => {
  const dao = { findVisits: vi.fn().mockResolvedValue(page) };
  return {
    dao,
    useCase: new ListTrackingVisitsUseCase(dao as unknown as TrackingDao),
  };
};

describe('ListTrackingVisitsUseCase (HU-37)', () => {
  it('passes every filter to the DAO for an admin', async () => {
    const { dao, useCase } = build();

    await expect(
      useCase.execute(filters, { id: 1, role: UserRole.ADMIN, zoneId: null }),
    ).resolves.toBe(page);
    expect(dao.findVisits).toHaveBeenCalledExactlyOnceWith(filters);
  });

  it("forces a regional director's own zone", async () => {
    const { dao, useCase } = build();

    await useCase.execute(filters, {
      id: 2,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 7,
    });

    expect(dao.findVisits).toHaveBeenCalledWith({ ...filters, territoryId: 7 });
  });
});
