import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ActivityLogEntry,
  ActivityLogService,
} from '../domain/activity-log.service.js';
import { ClientHistoryOrmEntity } from '../../../modules/clients/infrastructure/client-history.orm-entity.js';

/**
 * Persists every entry in the `client_history` table (HISTORIAL_CLIENTE).
 * Logging is best effort: a failed write is reported but never undoes the
 * business operation that triggered it.
 */
@Injectable()
export class TypeOrmActivityLogService implements ActivityLogService {
  private readonly logger = new Logger(TypeOrmActivityLogService.name);

  constructor(
    @InjectRepository(ClientHistoryOrmEntity)
    private readonly repository: Repository<ClientHistoryOrmEntity>,
  ) {}

  async record(entry: ActivityLogEntry): Promise<void> {
    const row = this.repository.create({
      clientId: this.resolveClientId(entry),
      userId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: String(entry.entityId),
      description: entry.description ?? null,
      metadata: entry.metadata ?? null,
    });

    try {
      await this.repository.save(row);
    } catch (error) {
      this.logger.error(
        `Could not record activity ${entry.action} ${entry.entityType}#${entry.entityId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private resolveClientId(entry: ActivityLogEntry): number | null {
    if (typeof entry.clientId === 'number') {
      return entry.clientId;
    }
    const fromMetadata = entry.metadata?.clientId;
    if (typeof fromMetadata === 'number') {
      return fromMetadata;
    }
    if (entry.entityType === 'client' && typeof entry.entityId === 'number') {
      return entry.entityId;
    }
    return null;
  }
}
