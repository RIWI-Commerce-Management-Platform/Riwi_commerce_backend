import { describe, expect, it } from 'vitest';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientHistoryOrmEntity } from './client-history.orm-entity.js';
import { ClientHistoryMapper } from './client-history.mapper.js';

describe('ClientHistoryMapper', () => {
  it('should map from ORM entity to domain model', () => {
    const orm = new ClientHistoryOrmEntity();
    orm.id = 1;
    orm.clientId = 10;
    orm.userId = 'usr-1';
    orm.action = 'visit.started';
    orm.description = 'Visit started';
    orm.entityType = 'visit';
    orm.entityId = '55';
    orm.metadata = { note: 'test' };
    orm.createdAt = new Date('2026-10-22T10:00:00Z');

    const domain = ClientHistoryMapper.toDomain(orm);

    expect(domain.id).toBe(1);
    expect(domain.clientId).toBe(10);
    expect(domain.userId).toBe('usr-1');
    expect(domain.action).toBe('visit.started');
    expect(domain.description).toBe('Visit started');
    expect(domain.entityType).toBe('visit');
    expect(domain.entityId).toBe('55');
    expect(domain.metadata).toEqual({ note: 'test' });
    expect(domain.createdAt).toEqual(new Date('2026-10-22T10:00:00Z'));
  });

  it('should map from domain model to ORM entity', () => {
    const domain = new ClientHistory({
      id: 2,
      clientId: 20,
      userId: 'usr-2',
      action: 'client.updated',
      description: 'Client details updated',
      entityType: 'client',
      entityId: 20,
      metadata: { field: 'phone' },
      createdAt: new Date('2026-10-22T12:00:00Z'),
    });

    const orm = ClientHistoryMapper.toOrm(domain);

    expect(orm.id).toBe(2);
    expect(orm.clientId).toBe(20);
    expect(orm.userId).toBe('usr-2');
    expect(orm.action).toBe('client.updated');
    expect(orm.description).toBe('Client details updated');
    expect(orm.entityType).toBe('client');
    expect(orm.entityId).toBe('20');
    expect(orm.metadata).toEqual({ field: 'phone' });
    expect(orm.createdAt).toEqual(new Date('2026-10-22T12:00:00Z'));
  });
});
