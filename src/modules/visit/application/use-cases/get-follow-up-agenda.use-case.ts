import { Injectable } from '@nestjs/common';

import { FollowUpDao } from '../../domain/dao/follow-up.dao.js';

import { FollowUp, FollowUpStatus } from '../../domain/follow-up.entity.js';

import { ClientReader } from '../../../../shared/clients/domain/client-reader.js';

import {
  AgendaPeriod,
  parseAgendaDate,
  resolveAgendaRange,
} from './agenda-range.js';

/**
 * HU-25: the follow-ups the advisor is responsible for in a day or week, so
 * they show up in the agenda next to the visits.
 */
@Injectable()
export class GetFollowUpAgendaUseCase {
  constructor(
    private readonly followUpDao: FollowUpDao,
    private readonly clientReader: ClientReader,
  ) {}

  async execute(
    responsibleId: number,
    period: AgendaPeriod,
    date?: string,
    status?: FollowUpStatus,
  ): Promise<FollowUp[]> {
    const { startDate, endDate } = resolveAgendaRange(
      period,
      parseAgendaDate(date),
    );

    const followUps = await this.followUpDao.findAgenda({
      responsibleId,
      startDate,
      endDate,
      status,
    });

    const clientIds = [...new Set(followUps.map((item) => item.clientId))];
    const clients = await Promise.all(
      clientIds.map((id) => this.clientReader.findById(id)),
    );
    const nameById = new Map(
      clients
        .filter((client) => client !== null)
        .map((client) => [client.id, client.name]),
    );

    return followUps.map((item) => {
      const name = nameById.get(item.clientId);
      return name ? item.withClientName(name) : item;
    });
  }
}
