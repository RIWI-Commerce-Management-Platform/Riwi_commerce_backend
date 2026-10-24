import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ClientHistoryEntry,
  ClientHistoryRepository,
} from '../domain/client-history.repository.js';
import { ClientHistoryOrmEntity } from './client-history.orm-entity.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

@Injectable()
export class TypeOrmClientHistoryRepository implements ClientHistoryRepository {
  constructor(
    @InjectRepository(ClientHistoryOrmEntity)
    private readonly repository: Repository<ClientHistoryOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async findByClientId(
    clientId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ClientHistoryEntry>> {
    const [rows, total] = await this.repository.findAndCount({
      where: { clientId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const userIds = [...new Set(rows.map((row) => row.userId))];
    const users = userIds.length
      ? await this.userRepository.find({
          where: { id: In(userIds) },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(users.map((user) => [user.id, user.name]));

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: rows.map((row) => ({
        id: row.id,
        clientId,
        userId: row.userId,
        userName: nameById.get(row.userId) ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
