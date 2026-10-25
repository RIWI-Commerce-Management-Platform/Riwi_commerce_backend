import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DashboardFiltersDto } from './dashboard-filters.dto.js';
import { queryValidationPipe } from '../../../../shared/pagination/query-validation.pipe.js';

const validate = (query: Record<string, unknown>) =>
  queryValidationPipe().transform(query, {
    type: 'query',
    metatype: DashboardFiltersDto,
  });

describe('DashboardFiltersDto', () => {
  it('accepts an empty query and any day of the week', async () => {
    await expect(validate({})).resolves.toEqual(new DashboardFiltersDto());
    await expect(
      validate({ weekStart: '2026-10-21', territoryId: '3' }),
    ).resolves.toMatchObject({ weekStart: '2026-10-21', territoryId: 3 });
  });

  it.each([
    [{ weekStart: '19-10-2026' }],
    [{ weekStart: '2026-10-19T00:00:00Z' }],
    [{ weekStart: '2026-02-30' }],
    [{ weekStart: '2026-13-01' }],
    [{ territoryId: 'abc' }],
    [{ territoryId: '0' }],
    [{ territoryId: '1.5' }],
  ])('rejects %o', async (query) => {
    await expect(validate(query)).rejects.toBeInstanceOf(BadRequestException);
  });
});
