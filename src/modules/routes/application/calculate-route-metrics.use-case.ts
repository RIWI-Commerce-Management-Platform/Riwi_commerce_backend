import { Injectable } from '@nestjs/common';
import { RouteClientReaderPort } from './ports/route-client-reader.port.js';
import {
  RouteDistanceCalculatorPort,
  RouteMetricsResult,
  RouteWaypoint,
} from './ports/route-distance-calculator.port.js';

/**
 * Input to estimate the metrics of a sequence of clients (HU-22).
 */
export interface CalculateRouteMetricsCommand {
  clientIds: number[];
  stopDurationMinutes?: number;
}

/**
 * Estimates the distance (km) and time of visiting an ordered list of
 * clients (HU-22), from their coordinates.
 */
@Injectable()
export class CalculateRouteMetricsUseCase {
  constructor(
    private readonly clientReader: RouteClientReaderPort,
    private readonly distanceCalculator: RouteDistanceCalculatorPort,
  ) {}

  async execute(
    command: CalculateRouteMetricsCommand,
  ): Promise<RouteMetricsResult> {
    if (command.clientIds.length === 0) {
      return { totalDistanceKm: 0, estimatedDurationMinutes: 0 };
    }

    const clients = await this.clientReader.findByIds(command.clientIds);
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const defaultDuration = command.stopDurationMinutes ?? 30;
    const totalStopAttention = command.clientIds.length * defaultDuration;

    const waypoints: RouteWaypoint[] = [];
    for (const clientId of command.clientIds) {
      const client = clientMap.get(clientId);
      if (client?.latitude != null && client.longitude != null) {
        waypoints.push({
          latitude: client.latitude,
          longitude: client.longitude,
        });
      }
    }

    return await this.distanceCalculator.calculateMetrics(
      waypoints,
      totalStopAttention,
    );
  }
}
