import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Repository } from 'typeorm';
import { TypeOrmActivityLogService } from './typeorm-activity-log.service.js';
import { ClientHistoryOrmEntity } from '../../../modules/clients/infrastructure/client-history.orm-entity.js';

describe('TypeOrmActivityLogService', () => {
  let saveMock: ReturnType<typeof vi.fn>;
  let mockRepo: Repository<ClientHistoryOrmEntity>;
  let service: TypeOrmActivityLogService;

  beforeEach(() => {
    saveMock = vi.fn().mockImplementation(async (entity) => entity);
    mockRepo = { save: saveMock } as unknown as Repository<ClientHistoryOrmEntity>;
    service = new TypeOrmActivityLogService(mockRepo);
  });

  it('should save log entry using entry.clientId when present', async () => {
    await service.record({
      clientId: 12,
      action: 'client.updated',
      entityType: 'client',
      entityId: 12,
      actorId: 'usr-1',
      description: 'Client details modified',
    });

    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0] as ClientHistoryOrmEntity;
    expect(saved.clientId).toBe(12);
    expect(saved.action).toBe('client.updated');
    expect(saved.description).toBe('Client details modified');
    expect(saved.userId).toBe('usr-1');
  });

  it('should extract clientId from metadata when entry.clientId is omitted', async () => {
    await service.record({
      action: 'visit.started',
      entityType: 'visit',
      entityId: 44,
      actorId: 20,
      metadata: { clientId: 15 },
    });

    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0] as ClientHistoryOrmEntity;
    expect(saved.clientId).toBe(15);
    expect(saved.action).toBe('visit.started');
    expect(saved.description).toBe('visit.started on visit #44');
    expect(saved.userId).toBe('20');
  });

  it('should extract clientId from entityId when entityType is client', async () => {
    await service.record({
      action: 'client.status_toggled',
      entityType: 'client',
      entityId: '77',
      actorId: 'admin',
    });

    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0] as ClientHistoryOrmEntity;
    expect(saved.clientId).toBe(77);
  });

  it('should skip recording when no clientId can be resolved', async () => {
    await service.record({
      action: 'system.event',
      entityType: 'system',
      entityId: 1,
      actorId: 0,
    });

    expect(saveMock).not.toHaveBeenCalled();
  });

  it('should delegate register() to record()', async () => {
    await service.register(
      33,
      'note.added',
      'Follow-up call with client',
      'advisor-5',
      { durationMinutes: 15 },
    );

    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0] as ClientHistoryOrmEntity;
    expect(saved.clientId).toBe(33);
    expect(saved.action).toBe('note.added');
    expect(saved.description).toBe('Follow-up call with client');
    expect(saved.userId).toBe('advisor-5');
    expect(saved.metadata).toEqual({ durationMinutes: 15 });
  });
});
