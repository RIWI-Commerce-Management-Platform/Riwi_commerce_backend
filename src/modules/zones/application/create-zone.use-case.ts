import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Zone } from '../domain/zone.entity.js';
import { ZoneRepository } from '../domain/zone.repository.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';

export interface CreateZoneInput {
  name: string;
}

@Injectable()
export class CreateZoneUseCase {
  constructor(private readonly zoneRepository: ZoneRepository) {}

  async execute(input: CreateZoneInput): Promise<Zone> {
    const existing = await this.zoneRepository.findByName(input.name);
    if (existing) {
      throw new ZoneNameAlreadyExistsError(input.name);
    }

    const now = new Date();
    const zone = new Zone({
      id: randomUUID(),
      name: input.name,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.zoneRepository.save(zone);
  }
}
