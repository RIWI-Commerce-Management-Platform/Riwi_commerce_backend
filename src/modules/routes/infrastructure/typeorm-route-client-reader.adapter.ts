import { Injectable } from '@nestjs/common';
import {
  RouteClientReaderPort,
  RouteClientDetails,
} from '../application/ports/route-client-reader.port.js';
import { ClientRepository } from '../../clients/domain/client.repository.js';

/**
 * Adaptador de infraestructura que implementa `RouteClientReaderPort`.
 *
 * En este adaptador consumo el repositorio de clientes de Yesid (Épica E2)
 * para extraer las coordenadas geográficas, zona y datos comerciales necesarios
 * para planificar las rutas y renderizarlas en el mapa interactivo.
 */
@Injectable()
export class TypeOrmRouteClientReaderAdapter implements RouteClientReaderPort {
  constructor(private readonly clientRepository: ClientRepository) {}

  /**
   * Con este método obtengo un cliente individual con sus coordenadas.
   */
  async findById(id: number): Promise<RouteClientDetails | null> {
    const client = await this.clientRepository.findById(id);
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

  /**
   * Con este método obtengo múltiples clientes en paralelo para alimentar el mapa y los cálculos de ruta.
   */
  async findByIds(ids: number[]): Promise<RouteClientDetails[]> {
    if (ids.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ids));
    const results = await Promise.all(
      uniqueIds.map((id) => this.clientRepository.findById(id)),
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
