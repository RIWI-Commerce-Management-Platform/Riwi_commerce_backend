import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { TrackingVisitsQueryDto } from './tracking-visits-query.dto.js';
import { queryValidationPipe } from '../../../../shared/pagination/query-validation.pipe.js';

const validate = (query: Record<string, unknown>) =>
  queryValidationPipe().transform(query, {
    type: 'query',
    metatype: TrackingVisitsQueryDto,
  });

describe('TrackingVisitsQueryDto', () => {
  it('accepts an empty query and parses the filters', async () => {
    await expect(validate({})).resolves.toBeInstanceOf(TrackingVisitsQueryDto);
    await expect(
      validate({
        weekStart: '2026-10-21',
        territoryId: '1',
        advisorId: '3',
        routeId: '2',
        status: 'NOT_VISITED',
        order: 'desc',
      }),
    ).resolves.toMatchObject({
      weekStart: '2026-10-21',
      territoryId: 1,
      advisorId: 3,
      routeId: 2,
      status: 'NOT_VISITED',
      order: 'desc',
    });
  });

  it.each([
    [{ weekStart: '2026-02-30' }],
    [{ weekStart: '21/10/2026' }],
    [{ territoryId: 'abc' }],
    [{ advisorId: '0' }],
    [{ routeId: '1.5' }],
    [{ status: 'DONE' }],
    [{ order: 'up' }],
  ])('rejects %o', async (query) => {
    await expect(validate(query)).rejects.toBeInstanceOf(BadRequestException);
  });
});
