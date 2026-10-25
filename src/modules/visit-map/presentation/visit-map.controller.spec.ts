import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { VisitMapController } from './visit-map.controller.js';
import { VisitMapQueryDto } from './dto/visit-map-query.dto.js';
import { VisitMapResponseDto } from './dto/visit-map-response.dto.js';
import type { GetVisitMapUseCase } from '../application/use-cases/get-visit-map.use-case.js';
import type { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

const map = {
  date: '2026-10-19',
  total: 0,
  withoutLocation: 0,
  counts: {
    VISITED: 0,
    PENDING: 0,
    NOT_VISITED: 0,
    ORDER_CLOSED: 0,
    RESCHEDULED: 0,
  },
  data: [],
};

describe('VisitMapController (HU-36)', () => {
  it('passes the filters and the actor to the use case', async () => {
    const actor = { id: 1, role: UserRole.ADMIN, zoneId: null };
    const execute = vi.fn().mockResolvedValue(map);
    const controller = new VisitMapController(
      { execute } as unknown as GetVisitMapUseCase,
      {
        extract: vi.fn().mockResolvedValue(actor),
      } as unknown as CurrentActorProvider,
    );
    const query = Object.assign(new VisitMapQueryDto(), {
      date: '2026-10-19',
      territoryId: 1,
    });

    const result = await controller.getMap(query, {} as never);

    expect(execute).toHaveBeenCalledExactlyOnceWith(
      { date: '2026-10-19', territoryId: 1, advisorId: undefined },
      actor,
    );
    expect(result).toBeInstanceOf(VisitMapResponseDto);
    expect(result).toEqual({ ...map });
  });

  it('is restricted to admins and regional directors', () => {
    const handler = Object.getOwnPropertyDescriptor(
      VisitMapController.prototype,
      'getMap',
    )?.value as object;

    expect(Reflect.getMetadata(GUARDS_METADATA, VisitMapController)).toEqual([
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      UserRole.ADMIN,
      UserRole.DIRECTOR_REGIONAL,
    ]);
  });
});

describe('VisitMapQueryDto', () => {
  const validate = (query: Record<string, unknown>) =>
    queryValidationPipe().transform(query, {
      type: 'query',
      metatype: VisitMapQueryDto,
    });

  it('accepts an empty query and parses the ids', async () => {
    await expect(validate({})).resolves.toBeInstanceOf(VisitMapQueryDto);
    await expect(
      validate({ date: '2026-10-19', territoryId: '1', advisorId: '3' }),
    ).resolves.toMatchObject({
      date: '2026-10-19',
      territoryId: 1,
      advisorId: 3,
    });
  });

  it.each([
    [{ date: '2026-02-30' }],
    [{ date: '19/10/2026' }],
    [{ territoryId: 'abc' }],
    [{ advisorId: '0' }],
  ])('rejects %o', async (query) => {
    await expect(validate(query)).rejects.toBeInstanceOf(BadRequestException);
  });
});
