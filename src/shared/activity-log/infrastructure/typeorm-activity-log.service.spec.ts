import { describe, expect, it, vi } from 'vitest';
import { TypeOrmActivityLogService } from './typeorm-activity-log.service.js';

describe('TypeOrmActivityLogService', () => {
  const buildService = (save = vi.fn().mockResolvedValue(undefined)) => {
    const repository = {
      create: vi.fn((row) => row),
      save,
    };
    return {
      service: new TypeOrmActivityLogService(repository as any),
      repository,
    };
  };

  it('persists the entry with the explicit client id', async () => {
    const { service, repository } = buildService();

    await service.record({
      action: 'client.updated',
      entityType: 'client',
      entityId: 5,
      actorId: 9,
      clientId: 5,
      description: 'Client updated',
    });

    expect(repository.save).toHaveBeenCalledWith({
      clientId: 5,
      userId: 9,
      action: 'client.updated',
      entityType: 'client',
      entityId: '5',
      description: 'Client updated',
      metadata: null,
    });
  });

  it('takes the client id from the metadata', async () => {
    const { service, repository } = buildService();

    await service.record({
      action: 'visit.started',
      entityType: 'visit',
      entityId: 3,
      actorId: 9,
      metadata: { clientId: 12 },
    });

    expect(repository.save.mock.calls[0][0].clientId).toBe(12);
  });

  it('uses the entity id for client entries without an explicit client', async () => {
    const { service, repository } = buildService();

    await service.record({
      action: 'client.created',
      entityType: 'client',
      entityId: 44,
      actorId: 9,
    });

    expect(repository.save.mock.calls[0][0].clientId).toBe(44);
  });

  it('stores a null client when none can be resolved', async () => {
    const { service, repository } = buildService();

    await service.record({
      action: 'route.assigned',
      entityType: 'route',
      entityId: 'R-1',
      actorId: 9,
    });

    expect(repository.save.mock.calls[0][0].clientId).toBeNull();
  });

  it('does not throw when the write fails', async () => {
    const { service } = buildService(
      vi.fn().mockRejectedValue(new Error('db down')),
    );

    await expect(
      service.record({
        action: 'client.updated',
        entityType: 'client',
        entityId: 1,
        actorId: 1,
      }),
    ).resolves.toBeUndefined();
  });
});
