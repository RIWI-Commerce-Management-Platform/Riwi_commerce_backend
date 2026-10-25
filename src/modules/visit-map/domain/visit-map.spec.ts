import { describe, expect, it } from 'vitest';
import { MapStatus, mapStatusOf } from './visit-map.js';

describe('mapStatusOf (HU-36 legend)', () => {
  it.each([
    ['VISITED', false, MapStatus.VISITED],
    ['PENDING', false, MapStatus.PENDING],
    ['IN_PROGRESS', false, MapStatus.PENDING],
    ['NOT_VISITED', false, MapStatus.NOT_VISITED],
    ['RESCHEDULE', false, MapStatus.RESCHEDULED],
    ['VISITED', true, MapStatus.ORDER_CLOSED],
    ['IN_PROGRESS', true, MapStatus.ORDER_CLOSED],
  ])('%s with orderGenerated=%s -> %s', (status, orderGenerated, expected) => {
    expect(mapStatusOf(status, orderGenerated)).toBe(expected);
  });
});
