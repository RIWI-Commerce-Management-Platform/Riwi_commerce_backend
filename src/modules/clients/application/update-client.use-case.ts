import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { GeocodingPort } from './ports/geocoding.port.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface UpdateClientInput {
  actorId?: number;
  id: number;
  nit?: string;
  businessName?: string;
  commercialName?: string;
  address?: string;
  department?: string;
  municipality?: string;
  neighborhood?: string;
  phone?: string;
  email?: string;
  zoneId?: number;
  clientTypeId?: number;
  potentialId?: number;
  clientStatusId?: number;
  visitFrequencyDays?: number;
  latitude?: number | null;
  longitude?: number | null;
}

@Injectable()
export class UpdateClientUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly geocodingPort: GeocodingPort,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: UpdateClientInput): Promise<Client> {
    const client = await this.clientRepository.findById(input.id);
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }

    if (input.nit !== undefined && input.nit !== client.nit) {
      const existing = await this.clientRepository.findByNit(input.nit);
      if (existing && existing.id !== client.id) {
        throw new ClientNitAlreadyExistsError(input.nit);
      }
    }

    const addressChanged =
      input.address !== undefined && input.address !== client.address;
    const municipalityChanged =
      input.municipality !== undefined &&
      input.municipality !== client.municipality;
    const departmentChanged =
      input.department !== undefined && input.department !== client.department;

    let lat = input.latitude;
    let lng = input.longitude;

    if (
      lat === undefined &&
      lng === undefined &&
      (addressChanged || municipalityChanged || departmentChanged)
    ) {
      const address = input.address ?? client.address;
      const municipality = input.municipality ?? client.municipality;
      const department = input.department ?? client.department;

      const coords = await this.geocodingPort.geocode(
        address,
        municipality,
        department,
      );
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    client.update({
      nit: input.nit,
      businessName: input.businessName,
      commercialName: input.commercialName,
      address: input.address,
      department: input.department,
      municipality: input.municipality,
      neighborhood: input.neighborhood,
      phone: input.phone,
      email: input.email,
      zoneId: input.zoneId,
      clientTypeId: input.clientTypeId,
      potentialId: input.potentialId,
      clientStatusId: input.clientStatusId,
      visitFrequencyDays: input.visitFrequencyDays,
      latitude: lat,
      longitude: lng,
    });

    const saved = await this.clientRepository.save(client);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.updated',
        entityType: 'client',
        entityId: saved.id!,
        clientId: saved.id!,
        actorId: input.actorId,
        description: 'Client data updated',
      });
    }

    return saved;
  }
}
