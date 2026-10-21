import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository, In } from 'typeorm';

import { VisitResultOption } from '../../domain/visit-result.entity.js';

import { VisitResultCatalogDao } from '../../domain/dao/visit-result-catalog.dao.js';

import { VisitResultOptionOrmEntity } from '../visit-result-option.orm-entity.js';

import { VisitResultOptionMapper } from '../mappers/visit-result-option.mapper.js';

@Injectable()
export class TypeOrmVisitResultCatalogDao implements VisitResultCatalogDao {
  constructor(
    @InjectRepository(VisitResultOptionOrmEntity)
    private readonly repository: Repository<VisitResultOptionOrmEntity>,
  ) {}

  async findByIds(ids: number[]): Promise<VisitResultOption[]> {
    if (ids.length === 0) {
      return [];
    }

    const options = await this.repository.find({
      where: { id: In(ids), isActive: true },
      order: { id: 'ASC' },
    });

    return options.map((option) => VisitResultOptionMapper.toDomain(option));
  }

  async findAll(): Promise<VisitResultOption[]> {
    const options = await this.repository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });

    return options.map((option) => VisitResultOptionMapper.toDomain(option));
  }
}
