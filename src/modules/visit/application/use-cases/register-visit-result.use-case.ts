import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { VisitDao } from '../../domain/dao/visit.dao.js';

@Injectable()
export class RegisterVisitResultUseCase {
  constructor(private readonly visitDao: VisitDao) {}

  async execute(
    id: number,
    advisorId: number,
    data: {
      endTime: string;
      observations: string;
      results: {
        id: number;
        name: string;
        observation?: string;
      }[];
    },
  ) {
    const visit = await this.visitDao.findByIdAndAdvisor(id, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    try {
      const completedVisit = visit.registerResult(data);

      return await this.visitDao.save(completedVisit);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Unable to register visit result.',
      );
    }
  }
}
