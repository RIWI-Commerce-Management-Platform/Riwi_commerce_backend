import { describe, expect, it, vi } from 'vitest';
import { CalculateRouteMetricsUseCase } from './calculate-route-metrics.use-case.js';
import {
  RouteClientReaderPort,
  RouteClientDetails,
} from './ports/route-client-reader.port.js';
import {
  RouteDistanceCalculatorPort,
  RouteMetricsResult,
} from './ports/route-distance-calculator.port.js';

describe('CalculateRouteMetricsUseCase', () => {
  const clients: RouteClientDetails[] = [
    {
      id: 1,
      commercialName: 'Cliente 1',
      address: 'Dir 1',
      municipality: 'B/quilla',
      zoneId: 1,
      latitude: 10.99,
      longitude: -74.8,
      isActive: true,
    },
    {
      id: 2,
      commercialName: 'Cliente 2',
      address: 'Dir 2',
      municipality: 'B/quilla',
      zoneId: 1,
      latitude: 11.01,
      longitude: -74.82,
      isActive: true,
    },
  ];

  it('should return 0 km and 0 mins for empty client list', async () => {
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn(),
      findByIds: vi.fn(),
    };
    const distanceCalc: RouteDistanceCalculatorPort = {
      calculateMetrics: vi.fn(),
    };

    const useCase = new CalculateRouteMetricsUseCase(
      clientReader,
      distanceCalc,
    );
    const result = await useCase.execute({ clientIds: [] });

    expect(result.totalDistanceKm).toBe(0);
    expect(result.estimatedDurationMinutes).toBe(0);
  });

  it('should calculate metrics based on client waypoints', async () => {
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn(),
      findByIds: vi.fn().mockResolvedValue(clients),
    };
    const distanceCalc: RouteDistanceCalculatorPort = {
      calculateMetrics: vi.fn().mockResolvedValue({
        totalDistanceKm: 8.4,
        estimatedDurationMinutes: 80,
      } as RouteMetricsResult),
    };

    const useCase = new CalculateRouteMetricsUseCase(
      clientReader,
      distanceCalc,
    );
    const result = await useCase.execute({
      clientIds: [1, 2],
      stopDurationMinutes: 30,
    });

    expect(result.totalDistanceKm).toBe(8.4);
    expect(result.estimatedDurationMinutes).toBe(80);
    expect(distanceCalc.calculateMetrics).toHaveBeenCalledWith(
      [
        { latitude: 10.99, longitude: -74.8 },
        { latitude: 11.01, longitude: -74.82 },
      ],
      60, // 2 stops * 30 min
    );
  });

  it('uses 30 minutes per stop and skips clients without coordinates', async () => {
    const clientReader: RouteClientReaderPort = {
      findById: vi.fn(),
      findByIds: vi
        .fn()
        .mockResolvedValue([
          clients[0],
          { ...clients[1], latitude: null },
          { ...clients[1], id: 3, longitude: null },
        ]),
    };
    const distanceCalc: RouteDistanceCalculatorPort = {
      calculateMetrics: vi.fn().mockResolvedValue({
        totalDistanceKm: 0,
        estimatedDurationMinutes: 120,
      }),
    };

    await new CalculateRouteMetricsUseCase(clientReader, distanceCalc).execute({
      clientIds: [1, 2, 3, 4],
    });

    expect(distanceCalc.calculateMetrics).toHaveBeenCalledWith(
      [{ latitude: 10.99, longitude: -74.8 }],
      120, // 4 stops * 30 min default; client 4 was not found
    );
  });
});
