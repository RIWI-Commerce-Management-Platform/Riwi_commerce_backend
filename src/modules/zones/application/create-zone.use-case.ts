import { Injectable } from '@nestjs/common';
import { Zone } from '../domain/zone.entity.js';
import { ZoneDao } from '../domain/zone.dao.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';

export interface CreateZoneInput {
  name: string;
}

@Injectable()
export class CreateZoneUseCase {
  constructor(private readonly zoneDao: ZoneDao) {}

  async execute(input: CreateZoneInput): Promise<Zone> {
    const existing = await this.zoneDao.findByName(input.name);
    if (existing) {
      throw new ZoneNameAlreadyExistsError(input.name);
    }

    const now = new Date();
    const zone = new Zone({
      name: input.name,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.zoneDao.save(zone);
  }
}
