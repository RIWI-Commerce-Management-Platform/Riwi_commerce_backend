import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

@Injectable()
export class StartVisitUseCase {
  constructor(private readonly visitDao: VisitDao) {}

  async execute(id: number, advisorId: number) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    try {
      const startedVisit = visit.start();

      return await this.visitDao.save(startedVisit);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to start visit.',
      );
    }
  }
}
