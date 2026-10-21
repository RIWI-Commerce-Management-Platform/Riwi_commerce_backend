import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { FollowUp } from '../../domain/follow-up.entity.js';
import {
  FollowUpFilters,
  FollowUpDao,
} from '../../domain/dao/follow-up.dao.js';
import { FollowUpOrmEntity } from '../follow-up.orm-entity.js';
import { FollowUpMapper } from '../follow-up.mapper.js';

@Injectable()
export class TypeOrmFollowUpDao implements FollowUpDao {
  constructor(
    @InjectRepository(FollowUpOrmEntity)
    private readonly repository: Repository<FollowUpOrmEntity>,
  ) {}

  async create(followUp: FollowUp): Promise<FollowUp> {
    const entity = FollowUpMapper.toPersistence(followUp);
    const saved = await this.repository.save(entity);
    return FollowUpMapper.toDomain(saved);
  }

  async save(followUp: FollowUp): Promise<FollowUp> {
    const entity = FollowUpMapper.toPersistence(followUp);
    const saved = await this.repository.save(entity);
    return FollowUpMapper.toDomain(saved);
  }

  async findById(id: number): Promise<FollowUp | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? FollowUpMapper.toDomain(entity) : null;
  }

  async findByIdAndAdvisor(
    id: number,
    advisorId: number,
  ): Promise<FollowUp | null> {
    const entity = await this.repository.findOne({
      where: {
        id,
        responsibleAdvisorId: advisorId,
      },
    });

    return entity ? FollowUpMapper.toDomain(entity) : null;
  }

  async findByVisitAndAdvisor(
    visitId: number,
    advisorId: number,
  ): Promise<FollowUp[]> {
    const entities = await this.repository.find({
      where: {
        visitId,
        responsibleAdvisorId: advisorId,
      },
      order: {
        nextDate: 'ASC',
      },
    });

    return entities.map((entity) => FollowUpMapper.toDomain(entity));
  }

  async findAll(filters: FollowUpFilters = {}): Promise<FollowUp[]> {
    const entities = await this.repository.find({
      where: {
        ...(filters.advisorId
          ? { responsibleAdvisorId: filters.advisorId }
          : {}),
        ...(filters.visitId ? { visitId: filters.visitId } : {}),
        ...(filters.completed !== undefined
          ? { completed: filters.completed }
          : {}),
        ...(filters.startDate && filters.endDate
          ? { nextDate: Between(filters.startDate, filters.endDate) }
          : {}),
      },
      order: {
        nextDate: 'ASC',
      },
    });

    return entities.map((entity) => FollowUpMapper.toDomain(entity));
  }
}
