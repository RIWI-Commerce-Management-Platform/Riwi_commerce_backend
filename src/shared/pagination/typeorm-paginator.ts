import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { PaginatedResult } from './paginated-result.interface.js';

export interface CommercialQueryFilter {
  clientId?: number;
  advisorId?: number;
  /** Zone of the client; needs a `client` relation on the entity. */
  zoneId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatorOptions<T extends ObjectLiteral, M> {
  query: SelectQueryBuilder<T>;
  page?: number;
  limit?: number;
  transform: (entity: T) => M;
}

export function applyCommercialFilters<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  alias: string,
  filter: CommercialQueryFilter,
): void {
  if (filter.clientId !== undefined) {
    query.andWhere(`${alias}.clientId = :clientId`, {
      clientId: filter.clientId,
    });
  }

  if (filter.advisorId !== undefined) {
    query.andWhere(`${alias}.advisorId = :advisorId`, {
      advisorId: filter.advisorId,
    });
  }

  if (filter.zoneId !== undefined) {
    query
      .innerJoin(`${alias}.client`, `${alias}_client`)
      .andWhere(`${alias}_client.zoneId = :zoneId`, { zoneId: filter.zoneId });
  }

  if (filter.status) {
    query.andWhere(`${alias}.status = :status`, { status: filter.status });
  }

  if (filter.startDate) {
    query.andWhere(`${alias}.createdAt >= :startDate`, {
      startDate: new Date(filter.startDate),
    });
  }

  if (filter.endDate) {
    const endOfDay = new Date(filter.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query.andWhere(`${alias}.createdAt <= :endDate`, { endDate: endOfDay });
  }
}

export async function paginateQuery<T extends ObjectLiteral, M>({
  query,
  page: rawPage,
  limit: rawLimit,
  transform,
}: PaginatorOptions<T, M>): Promise<PaginatedResult<M>> {
  const page = rawPage && rawPage >= 1 ? rawPage : 1;
  const limit = rawLimit && rawLimit >= 1 ? Math.min(rawLimit, 100) : 10;
  const skip = (page - 1) * limit;

  query.skip(skip).take(limit);

  const [entities, total] = await query.getManyAndCount();
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: entities.map(transform),
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
