import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface ToggleClientStatusInput {
  actorId?: number;
  id: number;
  isActive?: boolean;
}

@Injectable()
export class ToggleClientStatusUseCase {
  constructor(
    private readonly clientDao: ClientDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: ToggleClientStatusInput): Promise<Client> {
    const client = await this.clientDao.findById(input.id);
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }

    if (input.isActive !== undefined) {
      if (input.isActive) {
        client.activate();
      } else {
        client.deactivate();
      }
    } else {
      if (client.isActive) {
        client.deactivate();
      } else {
        client.activate();
      }
    }

    const saved = await this.clientDao.save(client);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.status_changed',
        entityType: 'client',
        entityId: saved.id!,
        clientId: saved.id!,
        actorId: input.actorId,
        description: saved.isActive ? 'Client activated' : 'Client deactivated',
      });
    }

    return saved;
  }
}
