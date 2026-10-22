import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityLogEntry,
  ActivityLogService,
} from '../domain/activity-log.service.js';
import { ClientHistoryOrmEntity } from '../../../modules/clients/infrastructure/client-history.orm-entity.js';

@Injectable()
export class TypeOrmActivityLogService extends ActivityLogService {
  private readonly logger = new Logger(TypeOrmActivityLogService.name);

  constructor(
    @InjectRepository(ClientHistoryOrmEntity)
    private readonly historyRepository: Repository<ClientHistoryOrmEntity>,
  ) {
    super();
  }

  async record(entry: ActivityLogEntry): Promise<void> {
    let resolvedClientId: number | null = null;

    if (entry.clientId !== undefined && entry.clientId !== null) {
      const parsed = Number(entry.clientId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        resolvedClientId = parsed;
      }
    } else if (
      entry.metadata?.clientId !== undefined &&
      entry.metadata.clientId !== null
    ) {
      const parsed = Number(entry.metadata.clientId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        resolvedClientId = parsed;
      }
    } else if (entry.entityType === 'client' && entry.entityId !== undefined) {
      const parsed = Number(entry.entityId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        resolvedClientId = parsed;
      }
    }

    if (!resolvedClientId) {
      this.logger.warn(
        `[activity-log] Skipped persisting history for action '${entry.action}' on ${entry.entityType}#${entry.entityId} because no valid clientId could be resolved.`,
      );
      return;
    }

    const description =
      entry.description?.trim() ||
      `${entry.action} on ${entry.entityType} #${entry.entityId}`;

    const orm = new ClientHistoryOrmEntity();
    orm.clientId = resolvedClientId;
    orm.userId = entry.actorId !== undefined && entry.actorId !== null ? String(entry.actorId) : null;
    orm.action = entry.action;
    orm.description = description;
    orm.entityType = entry.entityType;
    orm.entityId = entry.entityId !== undefined && entry.entityId !== null ? String(entry.entityId) : null;
    orm.metadata = entry.metadata ?? null;

    await this.historyRepository.save(orm);
  }
}
