import { describe, expect, it } from 'vitest';
import { HaversineRouteDistanceCalculatorAdapter } from './haversine-route-distance-calculator.adapter.js';

describe('HaversineRouteDistanceCalculatorAdapter', () => {
  const calculator = new HaversineRouteDistanceCalculatorAdapter();

  it('should return 0 km if fewer than 2 waypoints', async () => {
    const resultEmpty = await calculator.calculateMetrics([]);
    expect(resultEmpty.totalDistanceKm).toBe(0);
    expect(resultEmpty.estimatedDurationMinutes).toBe(0);

    const resultSingle = await calculator.calculateMetrics(
      [{ latitude: 10.99, longitude: -74.80 }],
      30,
    );
    expect(resultSingle.totalDistanceKm).toBe(0);
    expect(resultSingle.estimatedDurationMinutes).toBe(30);
  });

  it('should compute distance and duration between Barranquilla locations', async () => {
    // Plaza de la Paz (10.9902, -74.7876) to Buenavista (11.0145, -74.8239)
    // Direct distance is approx 4.7 km. With 1.3 factor ~ 6.1 km.
    const waypoints = [
      { latitude: 10.9902, longitude: -74.7876 },
      { latitude: 11.0145, longitude: -74.8239 },
    ];

    const result = await calculator.calculateMetrics(waypoints, 60);

    expect(result.totalDistanceKm).toBeGreaterThan(4);
    expect(result.totalDistanceKm).toBeLessThan(10);
    expect(result.estimatedDurationMinutes).toBeGreaterThan(60);
  });
});
