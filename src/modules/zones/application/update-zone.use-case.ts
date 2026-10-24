import { Injectable } from '@nestjs/common';
import { Zone } from '../domain/zone.entity.js';
import { ZoneRepository } from '../domain/zone.repository.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';
import { ZoneNotFoundError } from '../domain/zone-not-found.error.js';

export interface UpdateZoneInput {
  id: number;
  name?: string;
  isActive?: boolean;
}

@Injectable()
export class UpdateZoneUseCase {
  constructor(private readonly zoneRepository: ZoneRepository) {}

  async execute(input: UpdateZoneInput): Promise<Zone> {
    const zone = await this.zoneRepository.findById(input.id);
    if (!zone) {
      throw new ZoneNotFoundError(input.id);
    }

    if (input.name !== undefined && input.name !== zone.name) {
      const existing = await this.zoneRepository.findByName(input.name);
      if (existing) {
        throw new ZoneNameAlreadyExistsError(input.name);
      }
    }

    zone.update({ name: input.name, isActive: input.isActive });
    return this.zoneRepository.save(zone);
  }
}
