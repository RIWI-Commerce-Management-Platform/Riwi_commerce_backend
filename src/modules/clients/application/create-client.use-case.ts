import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { GeocodingPort } from './ports/geocoding.port.js';

export interface CreateClientInput {
  nit: string;
  businessName: string;
  commercialName: string;
  address: string;
  department: string;
  municipality: string;
  neighborhood: string;
  phone: string;
  email: string;
  zoneId: string;
  clientTypeId: string;
  potentialId: string;
  clientStatusId: string;
  visitFrequencyDays: number;
  latitude?: number | null;
  longitude?: number | null;
}

@Injectable()
export class CreateClientUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly geocodingPort: GeocodingPort,
  ) {}

  async execute(input: CreateClientInput): Promise<Client> {
    const existing = await this.clientRepository.findByNit(input.nit);
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

    return this.clientRepository.save(client);
  }
}
