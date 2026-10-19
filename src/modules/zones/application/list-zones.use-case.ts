import { Injectable } from '@nestjs/common';
import { Zone } from '../domain/zone.entity.js';
import { ZoneRepository } from '../domain/zone.repository.js';

@Injectable()
export class ListZonesUseCase {
  constructor(private readonly zoneRepository: ZoneRepository) {}

  async execute(): Promise<Zone[]> {
    return this.zoneRepository.findAll();
  }
}
