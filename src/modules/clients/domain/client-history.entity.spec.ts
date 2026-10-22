import { describe, expect, it } from 'vitest';
import { ClientHistory } from './client-history.entity.js';

describe('ClientHistory Entity', () => {
  it('should instantiate a valid ClientHistory', () => {
    const now = new Date();
    const history = new ClientHistory({
      id: 1,
      clientId: 10,
      action: 'client.created',
      description: 'Client was registered in the platform',
      userId: 'user-123',
      entityType: 'client',
      entityId: 10,
      metadata: { source: 'web' },
      createdAt: now,
    });

    expect(history.id).toBe(1);
    expect(history.clientId).toBe(10);
    expect(history.action).toBe('client.created');
    expect(history.description).toBe('Client was registered in the platform');
    expect(history.userId).toBe('user-123');
    expect(history.entityType).toBe('client');
    expect(history.entityId).toBe('10');
    expect(history.metadata).toEqual({ source: 'web' });
    expect(history.createdAt).toBe(now);
  });

  it('should create a ClientHistory using static create() helper with default date', () => {
    const history = ClientHistory.create({
      clientId: 5,
      action: 'visit.started',
      description: 'Visit #12 started',
      userId: '20',
      entityType: 'visit',
      entityId: 12,
    });

    expect(history.id).toBeUndefined();
    expect(history.clientId).toBe(5);
    expect(history.action).toBe('visit.started');
    expect(history.description).toBe('Visit #12 started');
    expect(history.userId).toBe('20');
    expect(history.entityType).toBe('visit');
    expect(history.entityId).toBe('12');
    expect(history.metadata).toBeNull();
    expect(history.createdAt).toBeInstanceOf(Date);
  });

  it('should throw an error if clientId is invalid or missing', () => {
    expect(
      () =>
        new ClientHistory({
          clientId: 0,
          action: 'note.added',
          description: 'Valid description',
        }),
    ).toThrow('Client ID must be a positive integer.');

    expect(
      () =>
        new ClientHistory({
          clientId: -1,
          action: 'note.added',
          description: 'Valid description',
        }),
    ).toThrow('Client ID must be a positive integer.');
  });

  it('should throw an error if action is empty or missing', () => {
    expect(
      () =>
        new ClientHistory({
          clientId: 1,
          action: '  ',
          description: 'Valid description',
        }),
    ).toThrow('Action is required for client history.');
  });

  it('should throw an error if description is empty or missing', () => {
    expect(
      () =>
        new ClientHistory({
          clientId: 1,
          action: 'client.updated',
          description: '',
        }),
    ).toThrow('Description is required for client history.');
  });
});
