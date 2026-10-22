import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RescheduleVisitDto } from './reschedule-visit.dto.js';

async function validateDto(payload: unknown) {
  return validate(plainToInstance(RescheduleVisitDto, payload));
}

describe('RescheduleVisitDto', () => {
  it('accepts an ISO date-time with a timezone offset', async () => {
    const errors = await validateDto({
      scheduledAt: '2026-10-22T14:30:00-05:00',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects a date without a time or timezone', async () => {
    const errors = await validateDto({ scheduledAt: '2026-10-22' });

    expect(errors.some((error) => error.property === 'scheduledAt')).toBe(true);
  });

  it('rejects an invalid calendar date', async () => {
    const errors = await validateDto({
      scheduledAt: '2026-02-30T14:30:00Z',
    });

    expect(errors.some((error) => error.property === 'scheduledAt')).toBe(true);
  });

  it('rejects a timestamp without a timezone', async () => {
    const errors = await validateDto({
      scheduledAt: '2026-10-22T14:30:00',
    });

    expect(errors.some((error) => error.property === 'scheduledAt')).toBe(true);
  });
});
