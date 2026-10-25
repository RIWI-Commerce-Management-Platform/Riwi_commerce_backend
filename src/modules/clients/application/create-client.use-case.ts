import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { GeocodingPort } from './ports/geocoding.port.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface CreateClientInput {
  actorId?: number;
  nit: string;
  businessName: string;
  commercialName: string;
  address: string;
  department: string;
  municipality: string;
  neighborhood: string;
  phone: string;
  email: string;
  zoneId: number;
  clientTypeId: number;
  potentialId: number;
  clientStatusId: number;
  visitFrequencyDays: number;
  latitude?: number | null;
  longitude?: number | null;
}

@Injectable()
export class CreateClientUseCase {
  constructor(
    private readonly clientDao: ClientDao,
    private readonly geocodingPort: GeocodingPort,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: CreateClientInput): Promise<Client> {
    const existing = await this.clientDao.findByNit(input.nit);
    if (existing) {
      throw new ClientNitAlreadyExistsError(input.nit);
    }

    let lat = input.latitude ?? null;
    let lng = input.longitude ?? null;

    if (lat === null || lng === null) {
      const coords = await this.geocodingPort.geocode(
        input.address,
        input.municipality,
        input.department,
      );
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    const now = new Date();
    const client = new Client({
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
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.clientDao.save(client);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.created',
        entityType: 'client',
        entityId: saved.id!,
        clientId: saved.id!,
        actorId: input.actorId,
        description: `Client ${saved.commercialName} (NIT ${saved.nit}) created`,
      });
    }

    return saved;
  }
}
