import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientHistoryOrmEntity } from './client-history.orm-entity.js';

export class ClientHistoryMapper {
  static toDomain(orm: ClientHistoryOrmEntity): ClientHistory {
    return new ClientHistory({
      id: orm.id,
      clientId: orm.clientId,
      userId: orm.userId,
      action: orm.action,
      description: orm.description,
      entityType: orm.entityType,
      entityId: orm.entityId,
      metadata: orm.metadata,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: ClientHistory): ClientHistoryOrmEntity {
    const orm = new ClientHistoryOrmEntity();
    if (domain.id !== undefined) {
      orm.id = domain.id;
    }
    orm.clientId = domain.clientId;
    orm.userId = domain.userId;
    orm.action = domain.action;
    orm.description = domain.description;
    orm.entityType = domain.entityType;
    orm.entityId = domain.entityId;
    orm.metadata = domain.metadata;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}
