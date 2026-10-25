import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../domain/zone.entity.js';
import { ZoneDao } from '../domain/zone.dao.js';
import { ZoneMapper } from './zone.mapper.js';
import { ZoneOrmEntity } from './zone.orm-entity.js';

@Injectable()
export class TypeOrmZoneDao implements ZoneDao {
  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly repository: Repository<ZoneOrmEntity>,
  ) {}

  async findAll(): Promise<Zone[]> {
    const rows = await this.repository.find({ where: { isActive: true } });
    return rows.map((row) => ZoneMapper.toDomain(row));
  }

  async findById(id: number): Promise<Zone | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? ZoneMapper.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Zone | null> {
    const row = await this.repository.findOneBy({ name });
    return row ? ZoneMapper.toDomain(row) : null;
  }

  async save(zone: Zone): Promise<Zone> {
    const saved = await this.repository.save(ZoneMapper.toOrm(zone));
    return ZoneMapper.toDomain(saved);
  }
}
