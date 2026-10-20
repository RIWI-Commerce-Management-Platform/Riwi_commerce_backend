import { Client } from '../domain/client.entity.js';
import { ClientOrmEntity } from './client.orm-entity.js';

export class ClientMapper {
  static toDomain(orm: ClientOrmEntity): Client {
    return new Client({
      id: orm.id,
      nit: orm.nit,
      businessName: orm.businessName,
      commercialName: orm.commercialName,
      address: orm.address,
      department: orm.department,
      municipality: orm.municipality,
      neighborhood: orm.neighborhood,
      phone: orm.phone,
      email: orm.email,
      zoneId: orm.zoneId,
      clientTypeId: orm.clientTypeId,
      potentialId: orm.potentialId,
      clientStatusId: orm.clientStatusId,
      visitFrequencyDays: orm.visitFrequencyDays,
      latitude: orm.latitude,
      longitude: orm.longitude,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Client): ClientOrmEntity {
    const orm = new ClientOrmEntity();
    orm.id = domain.id;
    orm.nit = domain.nit;
    orm.businessName = domain.businessName;
    orm.commercialName = domain.commercialName;
    orm.address = domain.address;
    orm.department = domain.department;
    orm.municipality = domain.municipality;
    orm.neighborhood = domain.neighborhood;
    orm.phone = domain.phone;
    orm.email = domain.email;
    orm.zoneId = domain.zoneId;
    orm.clientTypeId = domain.clientTypeId;
    orm.potentialId = domain.potentialId;
    orm.clientStatusId = domain.clientStatusId;
    orm.visitFrequencyDays = domain.visitFrequencyDays;
    orm.latitude = domain.latitude;
    orm.longitude = domain.longitude;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}

