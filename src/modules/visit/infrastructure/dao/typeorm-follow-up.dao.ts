import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Between, Repository } from 'typeorm';

import { FollowUp, FollowUpStatus } from '../../domain/follow-up.entity.js';

import {
  FollowUpAgendaFilters,
  FollowUpDao,
} from '../../domain/dao/follow-up.dao.js';

import { FollowUpOrmEntity } from '../follow-up.orm-entity.js';

@Injectable()
export class TypeOrmFollowUpDao implements FollowUpDao {
  constructor(
    @InjectRepository(FollowUpOrmEntity)
    private readonly repository: Repository<FollowUpOrmEntity>,
  ) {}

  async save(followUp: FollowUp): Promise<FollowUp> {
    const props = followUp.toJSON();
    const saved = await this.repository.save(
      this.repository.create({
        id: props.id,
        visitId: props.visitId,
        clientId: props.clientId,
        responsibleId: props.responsibleId,
        createdById: props.createdById,
        dueDate: props.dueDate,
        activity: props.activity,
        observation: props.observation,
        status: props.status,
        completedAt: props.completedAt,
      }),
    );
    return this.toDomain(saved);
  }

  async findById(id: number): Promise<FollowUp | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async findAgenda(filters: FollowUpAgendaFilters): Promise<FollowUp[]> {
    const rows = await this.repository.find({
      where: {
        responsibleId: filters.responsibleId,
        dueDate: Between(filters.startDate, filters.endDate),
        ...(filters.status ? { status: filters.status } : {}),
      },
      order: { dueDate: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: FollowUpOrmEntity): FollowUp {
    return new FollowUp({
      id: row.id,
      visitId: row.visitId,
      clientId: row.clientId,
      responsibleId: row.responsibleId,
      createdById: row.createdById,
      dueDate: row.dueDate,
      activity: row.activity,
      observation: row.observation,
      status: row.status as FollowUpStatus,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    });
  }
}
