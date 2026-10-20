import { Injectable, NotFoundException } from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

@Injectable()
export class GetVisitByIdUseCase {
  constructor(private readonly visitDao: VisitDao) {}

  async execute(id: number, advisorId: number) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    return visit;
  }
}
