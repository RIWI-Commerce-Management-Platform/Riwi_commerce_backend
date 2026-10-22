import { Injectable } from '@nestjs/common';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

export interface RecordClientActivityCommand {
  clientId: number;
  action: string;
  description: string;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class RecordClientActivityUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientHistoryRepository: ClientHistoryRepository,
  ) {}

  async execute(command: RecordClientActivityCommand): Promise<ClientHistory> {
    const client = await this.clientRepository.findById(command.clientId);
    if (!client) {
      throw new ClientNotFoundError(command.clientId);
    }

    const history = ClientHistory.create({
      clientId: command.clientId,
      action: command.action,
      description: command.description,
      userId: command.userId,
      entityType: command.entityType,
      entityId: command.entityId,
      metadata: command.metadata,
    });

    return this.clientHistoryRepository.save(history);
  }
}
