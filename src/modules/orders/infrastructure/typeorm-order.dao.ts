import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../domain/order.entity.js';
import { OrderDao, ListOrdersFilter } from '../domain/order.dao.js';
import { OrderOrmEntity } from './order.orm-entity.js';
import { OrderMapper } from './order.mapper.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import { ActorScope } from '../../../shared/auth/domain/current-actor.provider.js';
import {
  applyCommercialFilters,
  paginateQuery,
} from '../../../shared/pagination/typeorm-paginator.js';

@Injectable()
export class TypeOrmOrderDao implements OrderDao {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly ormRepository: Repository<OrderOrmEntity>,
  ) {}

  async save(order: Order): Promise<Order> {
    const ormEntity = OrderMapper.toOrm(order);
    const saved = await this.ormRepository.save(ormEntity);
    return OrderMapper.toDomain(saved);
  }

  async findById(id: number, scope?: ActorScope): Promise<Order | null> {
    if (
      !scope ||
      (scope.advisorId === undefined && scope.zoneId === undefined)
    ) {
      const found = await this.ormRepository.findOne({
        where: { id },
        relations: { items: true },
      });
      return found ? OrderMapper.toDomain(found) : null;
    }

    const query = this.ormRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.id = :id', { id });
    applyCommercialFilters(query, 'order', scope);
    const found = await query.getOne();
    return found ? OrderMapper.toDomain(found) : null;
  }

  async findByQuoteId(quoteId: number): Promise<Order | null> {
    const found = await this.ormRepository.findOne({
      where: { quoteId },
      relations: { items: true },
    });

    return found ? OrderMapper.toDomain(found) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const found = await this.ormRepository.findOne({
      where: { orderNumber },
      relations: { items: true },
    });

    return found ? OrderMapper.toDomain(found) : null;
  }

  async generateNextOrderNumber(): Promise<string> {
    try {
      const [{ nextval }] = await this.ormRepository.query<
        { nextval: string }[]
      >("SELECT nextval('order_number_seq') AS nextval");
      return `PED-${String(nextval).padStart(4, '0')}`;
    } catch {
      const [latest] = await this.ormRepository.find({
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (!latest?.orderNumber) {
        return 'PED-0001';
      }

      const matches = latest.orderNumber.match(/PED-(\d+)/);
      if (!matches || !matches[1]) {
        const count = await this.ormRepository.count();
        return `PED-${String(count + 1).padStart(4, '0')}`;
      }

      const nextSequential = Number.parseInt(matches[1], 10) + 1;
      return `PED-${String(nextSequential).padStart(4, '0')}`;
    }
  }

  async findPaginated(
    filter: ListOrdersFilter,
  ): Promise<PaginatedResult<Order>> {
    const query = this.ormRepository.createQueryBuilder('order');
    applyCommercialFilters(query, 'order', filter);
    query.orderBy('order.createdAt', 'DESC');

    return paginateQuery({
      query,
      page: filter.page,
      limit: filter.limit,
      transform: (entity) => OrderMapper.toDomain(entity),
    });
  }
}
