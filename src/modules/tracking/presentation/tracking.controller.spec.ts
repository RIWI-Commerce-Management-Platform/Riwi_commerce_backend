import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { TrackingController } from './tracking.controller.js';
import { TrackingVisitsQueryDto } from './dto/tracking-visits-query.dto.js';
import { TrackingVisitsResponseDto } from './dto/tracking-visits-response.dto.js';
import type { ListTrackingVisitsUseCase } from '../application/use-cases/list-tracking-visits.use-case.js';
import type { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

const row = {
  visitId: 12,
  scheduledAt: new Date('2026-10-19T13:00:00Z'),
  actualDate: '2026-10-19',
  status: 'VISITED',
  quoteGenerated: true,
  orderGenerated: false,
  client: { id: 4, commercialName: 'Client' },
  zone: { id: 1, name: 'Zone' },
  advisor: { id: 3, name: 'Laura' },
  route: null,
};

const page = {
  weekStart: '2026-10-19',
  weekEnd: '2026-10-25',
  data: [row],
  meta: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe('TrackingController (HU-37)', () => {
  it('maps the query and the actor to the use case', async () => {
    const actor = { id: 1, role: UserRole.ADMIN, zoneId: null };
    const execute = vi.fn().mockResolvedValue(page);
    const controller = new TrackingController(
      { execute } as unknown as ListTrackingVisitsUseCase,
      {
        extract: vi.fn().mockResolvedValue(actor),
      } as unknown as CurrentActorProvider,
    );
    const query = Object.assign(new TrackingVisitsQueryDto(), {
      weekStart: '2026-10-19',
      territoryId: 1,
      page: '2',
      limit: '500',
    });

    const result = await controller.listVisits(query, {} as never);

    expect(execute).toHaveBeenCalledExactlyOnceWith(
      {
        weekStart: '2026-10-19',
        territoryId: 1,
        advisorId: undefined,
        routeId: undefined,
        status: undefined,
        page: 2,
        limit: 100,
        order: 'asc',
      },
      actor,
    );
    expect(result).toBeInstanceOf(TrackingVisitsResponseDto);
    expect(result).toMatchObject({ weekStart: '2026-10-19', data: [row] });
  });

  it('is restricted to admins and regional directors', () => {
    const handler = Object.getOwnPropertyDescriptor(
      TrackingController.prototype,
      'listVisits',
    )?.value as object;

    expect(Reflect.getMetadata(GUARDS_METADATA, TrackingController)).toEqual([
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      UserRole.ADMIN,
      UserRole.DIRECTOR_REGIONAL,
    ]);
  });
});
