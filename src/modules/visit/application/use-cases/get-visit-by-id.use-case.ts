import { Injectable, NotFoundException } from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

import { Visit } from '../../domain/visit.entity.js';

import { ClientReader } from '../../../../shared/clients/domain/client-reader.js';

@Injectable()
export class GetVisitByIdUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly clientReader: ClientReader,
  ) {}

  async execute(id: number, advisorId: number) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    return this.withClientDetails(visit);
  }

  private async withClientDetails(visit: Visit): Promise<Visit> {
    const client = await this.clientReader.findById(visit.clientId);

    if (!client) {
      return visit;
    }

    return new Visit({
      ...visit.toJSON(),
      clientName: client.name,
      contactName: client.contactName,
      clientPotential: client.potential,
    });
  }
}
