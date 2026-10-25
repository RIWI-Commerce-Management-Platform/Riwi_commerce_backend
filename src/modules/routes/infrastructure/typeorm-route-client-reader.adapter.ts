import { Injectable } from '@nestjs/common';
import {
  RouteClientReaderPort,
  RouteClientDetails,
} from '../application/ports/route-client-reader.port.js';
import { ClientDao } from '../../clients/domain/client.dao.js';

/**
 * RouteClientReaderPort implementation. Reads clients through the clients
 * module DAO (epic E2) to get the coordinates, zone and commercial
 * data needed to plan routes and draw them on the map.
 */
@Injectable()
export class TypeOrmRouteClientReaderAdapter implements RouteClientReaderPort {
  constructor(private readonly clientDao: ClientDao) {}

  /** One client with its coordinates. */
  async findById(id: number): Promise<RouteClientDetails | null> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      return null;
    }

    return {
      id: client.id!,
      commercialName: client.commercialName,
      address: client.address,
      municipality: client.municipality,
      zoneId: client.zoneId,
      latitude: client.latitude,
      longitude: client.longitude,
      isActive: client.isActive,
    };
  }

  /** Several clients at once, for the map and the route metrics. */
  async findByIds(ids: number[]): Promise<RouteClientDetails[]> {
    if (ids.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ids));
    const results = await Promise.all(
      uniqueIds.map((id) => this.clientDao.findById(id)),
    );

    const details: RouteClientDetails[] = [];
    for (const client of results) {
      if (client && client.id !== undefined) {
        details.push({
          id: client.id,
          commercialName: client.commercialName,
          address: client.address,
          municipality: client.municipality,
          zoneId: client.zoneId,
          latitude: client.latitude,
          longitude: client.longitude,
          isActive: client.isActive,
        });
      }
    }

    return details;
  }
}
