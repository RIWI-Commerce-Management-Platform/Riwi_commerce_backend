import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { ClientHistoryFilterCriteria } from '../domain/client-history-filter.criteria.js';
import { ClientHistoryOrmEntity } from './client-history.orm-entity.js';
import { ClientHistoryMapper } from './client-history.mapper.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

@Injectable()
export class TypeOrmClientHistoryRepository implements ClientHistoryRepository {
  constructor(
    @InjectRepository(ClientHistoryOrmEntity)
    private readonly repository: Repository<ClientHistoryOrmEntity>,
  ) {}

  async save(history: ClientHistory): Promise<ClientHistory> {
    const orm = ClientHistoryMapper.toOrm(history);
    const saved = await this.repository.save(orm);
    return ClientHistoryMapper.toDomain(saved);
  }

  async findById(id: number): Promise<ClientHistory | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? ClientHistoryMapper.toDomain(row) : null;
  }

  async findByClientId(
    clientId: number,
    criteria?: ClientHistoryFilterCriteria,
  ): Promise<PaginatedResult<ClientHistory>> {
    const qb = this.repository.createQueryBuilder('history');

    qb.where('history.client_id = :clientId', { clientId });

    if (criteria?.action && criteria.action.trim().length > 0) {
      qb.andWhere('history.action = :action', { action: criteria.action.trim() });
    }

    if (criteria?.startDate) {
      qb.andWhere('history.created_at >= :startDate', { startDate: criteria.startDate });
    }

    if (criteria?.endDate) {
      qb.andWhere('history.created_at <= :endDate', { endDate: criteria.endDate });
    }

    const page = criteria?.page && criteria.page > 0 ? criteria.page : 1;
    const limit = criteria?.limit && criteria.limit > 0 ? criteria.limit : 10;

    qb.orderBy('history.created_at', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => ClientHistoryMapper.toDomain(row)),
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

  async findRecent(limit = 10): Promise<ClientHistory[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const rows = await this.repository.find({
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });
    return rows.map((row) => ClientHistoryMapper.toDomain(row));
  }
}
