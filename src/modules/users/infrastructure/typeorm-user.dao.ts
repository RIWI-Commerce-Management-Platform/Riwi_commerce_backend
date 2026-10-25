import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity.js';
import { UserFilterCriteria, UserDao } from '../domain/user.dao.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/**
 * Reads the Better Auth `user` table. Writes stay in Better Auth (sign-up,
 * password) and in AssignUserRoleUseCase (role and zone).
 */
@Injectable()
export class TypeOrmUserDao implements UserDao {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    const entity = await this.userRepository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findPaginated(
    criteria: UserFilterCriteria,
  ): Promise<PaginatedResult<User>> {
    const query = this.userRepository.createQueryBuilder('u');

    if (criteria.role) {
      query.andWhere('u.role = :role', { role: criteria.role });
    }
    if (criteria.zoneId !== undefined) {
      query.andWhere('u.zoneId = :zoneId', { zoneId: criteria.zoneId });
    }
    if (criteria.search?.trim()) {
      query.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${criteria.search.trim()}%`,
      });
    }

    const [entities, total] = await query
      .orderBy('u.name', 'ASC')
      .addOrderBy('u.id', 'ASC')
      .skip((criteria.page - 1) * criteria.limit)
      .take(criteria.limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / criteria.limit) || 1;
    return {
      data: entities.map((entity) => this.toDomain(entity)),
      meta: {
        total,
        page: criteria.page,
        limit: criteria.limit,
        totalPages,
        hasNextPage: criteria.page < totalPages,
        hasPreviousPage: criteria.page > 1,
      },
    };
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      emailVerified: entity.emailVerified,
      role: entity.role,
      zoneId: entity.zoneId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
