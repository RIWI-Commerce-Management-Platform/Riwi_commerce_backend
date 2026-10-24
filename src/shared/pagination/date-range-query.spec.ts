import { describe, expect, it } from 'vitest';
import { endOfDay, startOfDay } from './date-range-query.js';

describe('date range query helpers', () => {
  it('returns the bounds of the day', () => {
    expect(startOfDay('2026-10-20')).toEqual(new Date(2026, 9, 20, 0, 0, 0, 0));
    expect(endOfDay('2026-10-20')).toEqual(
      new Date(2026, 9, 20, 23, 59, 59, 999),
    );
  });

  it('ignores missing or malformed dates', () => {
    expect(startOfDay()).toBeUndefined();
    expect(endOfDay('20/10/2026')).toBeUndefined();
  });
});
