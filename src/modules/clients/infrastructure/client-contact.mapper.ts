import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactOrmEntity } from './client-contact.orm-entity.js';

export class ClientContactMapper {
  static toDomain(orm: ClientContactOrmEntity): ClientContact {
    return new ClientContact({
      id: orm.id,
      clientId: orm.clientId,
      name: orm.name,
      position: orm.position,
      phone: orm.phone,
      mobile: orm.mobile,
      email: orm.email,
      isPrimary: orm.isPrimary,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: ClientContact): ClientContactOrmEntity {
    const orm = new ClientContactOrmEntity();
    if (domain.id !== undefined) {
      orm.id = domain.id;
    }
    orm.clientId = domain.clientId;
    orm.name = domain.name;
    orm.position = domain.position;
    orm.phone = domain.phone;
    orm.mobile = domain.mobile;
    orm.email = domain.email;
    orm.isPrimary = domain.isPrimary;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
