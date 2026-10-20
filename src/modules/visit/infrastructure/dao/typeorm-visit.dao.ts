import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Between } from 'typeorm';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import {
  VisitAgendaFilters,
  VisitDao,
} from '../../domain/dao/visit.dao.js';

import { VisitOrmEntity } from '../visit.orm-entity.js';

import { VisitMapper } from '../mappers/visit-mapper.js';

@Injectable()
export class TypeOrmVisitDao implements VisitDao {
  constructor(
    @InjectRepository(VisitOrmEntity)
    private readonly repository: Repository<VisitOrmEntity>,
  ) {}

  async findAgenda(filters: VisitAgendaFilters): Promise<Visit[]> {
    const visits = await this.repository.find({
      where: {
        advisorId: filters.advisorId,
        scheduledAt: Between(filters.startDate, filters.endDate),
      },
      order: {
        scheduledAt: 'ASC',
      },
    });

    return visits.map(VisitMapper.toDomain);
  }

  async findById(id: number): Promise<Visit | null> {
    const visit = await this.repository.findOne({
      where: { id },
    });

    return visit ? VisitMapper.toDomain(visit) : null;
  }

  async findByIdAndAdvisor(
    id: number,
    advisorId: number,
  ): Promise<Visit | null> {
    const visit = await this.repository.findOne({
      where: {
        id,
        advisorId,
      },
    });

    return visit ? VisitMapper.toDomain(visit) : null;
  }

  async save(visit: Visit): Promise<Visit> {
    const entity = VisitMapper.toPersistence(visit);

    const saved = await this.repository.save(entity);

    return VisitMapper.toDomain(saved);
  }
}
