import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../domain/client.entity.js';
import { ClientFilterCriteria } from '../domain/client-filter.criteria.js';
import { ClientDao } from '../domain/client.dao.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import { ClientMapper } from './client.mapper.js';
import { ClientOrmEntity } from './client.orm-entity.js';

@Injectable()
export class TypeOrmClientDao implements ClientDao {
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly repository: Repository<ClientOrmEntity>,
  ) {}

  async findById(id: number): Promise<Client | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? ClientMapper.toDomain(row) : null;
  }

  async findByNit(nit: string): Promise<Client | null> {
    const row = await this.repository.findOneBy({ nit });
    return row ? ClientMapper.toDomain(row) : null;
  }

  async save(client: Client): Promise<Client> {
    const saved = await this.repository.save(ClientMapper.toOrm(client));
    return ClientMapper.toDomain(saved);
  }

  async findPaginated(
    criteria: ClientFilterCriteria,
  ): Promise<PaginatedResult<Client>> {
    const qb = this.repository.createQueryBuilder('client');

    if (criteria.search && criteria.search.trim().length > 0) {
      const searchTerm = `%${criteria.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(client.nit) LIKE :search OR LOWER(client.business_name) LIKE :search OR LOWER(client.commercial_name) LIKE :search)',
        { search: searchTerm },
      );
    }

    if (criteria.zoneId) {
      qb.andWhere('client.zone_id = :zoneId', { zoneId: criteria.zoneId });
    }

    if (criteria.clientTypeId) {
      qb.andWhere('client.client_type_id = :clientTypeId', {
        clientTypeId: criteria.clientTypeId,
      });
    }

    if (criteria.potentialId) {
      qb.andWhere('client.potential_id = :potentialId', {
        potentialId: criteria.potentialId,
      });
    }

    if (criteria.municipality && criteria.municipality.trim().length > 0) {
      qb.andWhere('LOWER(client.municipality) = LOWER(:municipality)', {
        municipality: criteria.municipality.trim(),
      });
    }

    if (criteria.isActive !== undefined) {
      qb.andWhere('client.is_active = :isActive', {
        isActive: criteria.isActive,
      });
    }

    const page = criteria.page > 0 ? criteria.page : 1;
    const limit = criteria.limit > 0 ? criteria.limit : 10;

    qb.orderBy('client.created_at', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => ClientMapper.toDomain(row)),
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
