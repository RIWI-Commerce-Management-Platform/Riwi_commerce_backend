import { Injectable } from '@nestjs/common';
import { Zone } from '../domain/zone.entity.js';
import { ZoneDao } from '../domain/zone.dao.js';

@Injectable()
export class ListZonesUseCase {
  constructor(private readonly zoneDao: ZoneDao) {}

  async execute(): Promise<Zone[]> {
    return this.zoneDao.findAll();
  }
}
