import { Injectable, Optional } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface ToggleClientStatusInput {
  id: number;
  isActive?: boolean;
}

@Injectable()
export class ToggleClientStatusUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    @Optional() private readonly activityLog?: ActivityLogService,
  ) {}

  async execute(input: ToggleClientStatusInput): Promise<Client> {
    const client = await this.clientRepository.findById(input.id);
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

    const saved = await this.clientRepository.save(client);

    if (this.activityLog && saved.id) {
      await this.activityLog.record({
        clientId: saved.id,
        action: saved.isActive ? 'client.activated' : 'client.deactivated',
        entityType: 'client',
        entityId: saved.id,
        actorId: 'system',
        description: `Client '${saved.commercialName}' status toggled to ${saved.isActive ? 'active' : 'inactive'}`,
      });
    }

    return saved;
  }
}
