import { Zone } from '../domain/zone.entity.js';
import { ZoneOrmEntity } from './zone.orm-entity.js';

export class ZoneMapper {
  static toDomain(orm: ZoneOrmEntity): Zone {
    return new Zone({
      id: orm.id,
      name: orm.name,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Zone): ZoneOrmEntity {
    const orm = new ZoneOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
