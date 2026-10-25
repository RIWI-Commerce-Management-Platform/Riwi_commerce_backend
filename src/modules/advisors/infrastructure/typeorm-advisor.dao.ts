import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Advisor } from '../domain/advisor.entity.js';
import { AdvisorFilterCriteria, AdvisorDao } from '../domain/advisor.dao.js';
import { AdvisorOrmEntity } from './advisor.orm-entity.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

interface AdvisorRow {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  document_number: string | null;
  zone_id: number | null;
  weekly_visit_goal: number | null;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date | null;
}

/**
 * Advisors are read from the user table (role ASESOR) with a LEFT JOIN to
 * their profile, so advisors registered before the profile existed are
 * listed as active with an empty profile.
 */
@Injectable()
export class TypeOrmAdvisorDao implements AdvisorDao {
  constructor(
    @InjectRepository(AdvisorOrmEntity)
    private readonly advisorRepository: Repository<AdvisorOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zoneRepository: Repository<ZoneOrmEntity>,
  ) {}

  async findById(userId: number): Promise<Advisor | null> {
    const row = await this.baseQuery()
      .andWhere('u.id = :userId', { userId })
      .getRawOne<AdvisorRow>();
    return row ? this.toDomain(row) : null;
  }

  async findPaginated(
    criteria: AdvisorFilterCriteria,
  ): Promise<PaginatedResult<Advisor>> {
    const query = this.baseQuery();

    if (criteria.search?.trim()) {
      query.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${criteria.search.trim()}%`,
      });
    }
    if (criteria.zoneId !== undefined) {
      query.andWhere('a.zone_id = :zoneId', { zoneId: criteria.zoneId });
    }
    if (criteria.isActive !== undefined) {
      query.andWhere('COALESCE(a.is_active, true) = :isActive', {
        isActive: criteria.isActive,
      });
    }

    const total = await query.getCount();
    const rows = await query
      .orderBy('u.name', 'ASC')
      .offset((criteria.page - 1) * criteria.limit)
      .limit(criteria.limit)
      .getRawMany<AdvisorRow>();

    const totalPages = Math.ceil(total / criteria.limit) || 1;
    return {
      data: rows.map((row) => this.toDomain(row)),
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

  async save(advisor: Advisor): Promise<Advisor> {
    await this.advisorRepository.manager.transaction(async (manager) => {
      await manager
        .getRepository(UserOrmEntity)
        .update(
          { id: advisor.userId },
          { name: advisor.name, email: advisor.email },
        );
      await manager.getRepository(AdvisorOrmEntity).save({
        userId: advisor.userId,
        phone: advisor.phone,
        documentNumber: advisor.documentNumber,
        zoneId: advisor.zoneId,
        weeklyVisitGoal: advisor.weeklyVisitGoal,
        isActive: advisor.isActive,
      });
    });

    return (await this.findById(advisor.userId)) ?? advisor;
  }

  async isEmailTaken(email: string, exceptUserId?: number): Promise<boolean> {
    return this.userRepository.exists({
      where:
        exceptUserId === undefined
          ? { email }
          : { email, id: Not(exceptUserId) },
    });
  }

  async zoneExists(zoneId: number): Promise<boolean> {
    return this.zoneRepository.exists({ where: { id: zoneId } });
  }

  private baseQuery() {
    return this.userRepository
      .createQueryBuilder('u')
      .leftJoin(AdvisorOrmEntity, 'a', 'a.user_id = u.id')
      .select([
        'u.id AS user_id',
        'u.name AS name',
        'u.email AS email',
        'a.phone AS phone',
        'a.document_number AS document_number',
        'a.zone_id AS zone_id',
        'a.weekly_visit_goal AS weekly_visit_goal',
        'a.is_active AS is_active',
        'u.createdAt AS created_at',
        'a.updated_at AS updated_at',
      ])
      .where('u.role = :role', { role: UserRole.ASESOR });
  }

  private toDomain(row: AdvisorRow): Advisor {
    return new Advisor({
      userId: Number(row.user_id),
      name: row.name,
      email: row.email,
      phone: row.phone,
      documentNumber: row.document_number,
      zoneId: row.zone_id === null ? null : Number(row.zone_id),
      weeklyVisitGoal:
        row.weekly_visit_goal === null ? null : Number(row.weekly_visit_goal),
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
    });
  }
}
