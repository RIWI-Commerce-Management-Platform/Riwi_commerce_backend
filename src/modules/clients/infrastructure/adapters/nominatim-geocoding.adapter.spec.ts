import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { NominatimGeocodingAdapter } from './nominatim-geocoding.adapter.js';

describe('NominatimGeocodingAdapter', () => {
  const adapter = new NominatimGeocodingAdapter();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return coordinates when Nominatim returns valid results', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          lat: '6.2442',
          lon: '-75.5812',
          display_name: 'Medellín, Antioquia, Colombia',
        },
      ],
    });

    const result = await adapter.geocode('Calle 50', 'Medellín', 'Antioquia');

    expect(result).toEqual({ lat: 6.2442, lng: -75.5812 });
  });

  it('should return null when results array is empty', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await adapter.geocode('Non Existent Street', 'Unknown City');

    expect(result).toBeNull();
  });

  it('should return null when first result is missing lat or lon', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ display_name: 'Medellín' }],
    });

    const result = await adapter.geocode('Calle 50', 'Medellín');
    expect(result).toBeNull();
  });

  it('should return null when lat or lon is NaN', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ lat: 'invalid', lon: 'invalid' }],
    });

    const result = await adapter.geocode('Calle 50', 'Medellín');
    expect(result).toBeNull();
  });

  it('should return null without throwing when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const result = await adapter.geocode('Calle 50', 'Medellín');

    expect(result).toBeNull();
  });

  it('should return null without throwing when fetch throws an error', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const result = await adapter.geocode('Calle 50', 'Medellín');

    expect(result).toBeNull();
  });
});
