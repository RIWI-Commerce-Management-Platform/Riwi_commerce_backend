import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Between, In } from 'typeorm';

import { Visit } from '../../domain/visit.entity.js';

import {
  CreateVisitCommand,
  VisitAgendaFilters,
  VisitDao,
} from '../../domain/dao/visit.dao.js';

import { VisitOrmEntity } from '../visit.orm-entity.js';

import { VisitResultLinkOrmEntity } from '../visit-result-link.orm-entity.js';

import { VisitResultOptionOrmEntity } from '../visit-result-option.orm-entity.js';

import { VisitMapper } from '../mappers/visit-mapper.js';

@Injectable()
export class TypeOrmVisitDao implements VisitDao {
  constructor(
    @InjectRepository(VisitOrmEntity)
    private readonly repository: Repository<VisitOrmEntity>,
    @InjectRepository(VisitResultLinkOrmEntity)
    private readonly linkRepository: Repository<VisitResultLinkOrmEntity>,
    @InjectRepository(VisitResultOptionOrmEntity)
    private readonly resultOptionRepository: Repository<VisitResultOptionOrmEntity>,
  ) {}

  async findAgenda(filters: VisitAgendaFilters): Promise<Visit[]> {
    const where: any = {
      scheduledAt: Between(filters.startDate, filters.endDate),
    };

    if (filters.advisorId && filters.advisorId > 0) {
      where.advisorId = filters.advisorId;
    }

    const visits = await this.repository.find({
      where,
      order: {
        scheduledAt: 'ASC',
      },
    });

    return visits.map((visit) => VisitMapper.toDomain(visit));
  }

  async create(command: CreateVisitCommand): Promise<Visit> {
    const entity = new VisitOrmEntity();
    entity.clientId = command.clientId;
    entity.advisorId = command.advisorId;
    entity.routeId = command.routeId ?? null;
    entity.scheduledAt = command.scheduledAt;
    entity.status = command.status ?? 'PENDING';
    entity.objective = command.objective ?? null;
    entity.observations = command.observations ?? null;
    entity.startTime = command.startTime ?? null;
    entity.endTime = command.endTime ?? null;
    entity.quoteGenerated = command.quoteGenerated ?? false;
    entity.orderGenerated = command.orderGenerated ?? false;

    const saved = await this.repository.save(entity);

    if (command.results && command.results.length > 0) {
      const links = command.results.map((result) => {
        const link = new VisitResultLinkOrmEntity();
        link.visitId = saved.id;
        link.resultId = result.id;
        link.observation = result.observation ?? null;
        return link;
      });
      await this.linkRepository.save(links);
    }

    return (await this.findById(saved.id))!;
  }

  async findById(id: number): Promise<Visit | null> {
    const visit = await this.repository.findOne({
      where: { id },
    });

    if (!visit) {
      return null;
    }

    await this.attachResults(visit);

    return VisitMapper.toDomain(visit);
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

    if (!visit) {
      return null;
    }

    await this.attachResults(visit);

    return VisitMapper.toDomain(visit);
  }

  async save(visit: Visit): Promise<Visit> {
    return this.repository.manager.transaction(async (manager) => {
      const visitRepository = manager.getRepository(VisitOrmEntity);
      const linkRepository = manager.getRepository(VisitResultLinkOrmEntity);

      const entity = VisitMapper.toPersistence(visit);
      const saved = await visitRepository.save(entity);

      const results = visit.results;

      if (results.length > 0) {
        await linkRepository.delete({ visitId: saved.id });

        const links = results.map((result) => {
          const link = new VisitResultLinkOrmEntity();
          link.visitId = saved.id;
          link.resultId = result.id;
          link.observation = result.observation ?? null;
          return link;
        });

        await linkRepository.save(links);
      }

      await this.attachResults(saved);

      return VisitMapper.toDomain(saved);
    });
  }

  // Loads the result links and their catalog names for a visit and attaches
  // them to the entity, replacing the previous bidirectional ORM relation.
  private async attachResults(visit: VisitOrmEntity): Promise<void> {
    const links = await this.linkRepository.find({
      where: { visitId: visit.id },
    });

    if (links.length === 0) {
      visit.resultLinks = [];
      return;
    }

    const options = await this.resultOptionRepository.find({
      where: { id: In(links.map((link) => link.resultId)) },
    });

    const optionNameById = new Map(
      options.map((option) => [option.id, option.name]),
    );

    visit.resultLinks = links.map((link) => ({
      resultId: link.resultId,
      observation: link.observation,
      resultOption: { name: optionNameById.get(link.resultId) ?? '' },
    }));
  }
}
