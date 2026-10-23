import { Injectable, NotFoundException } from '@nestjs/common';

import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { Quote } from '../domain/quote.entity.js';
import { CreateQuoteCommand } from './dto/create-quote.command.js';
import { CreateQuoteUseCase } from './create-quote.use-case.js';

export type CreateQuoteFromVisitCommand = Omit<CreateQuoteCommand, 'clientId'>;

@Injectable()
export class CreateQuoteFromVisitUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly createQuote: CreateQuoteUseCase,
  ) {}

  async execute(
    visitId: number,
    advisorId: number,
    command: CreateQuoteFromVisitCommand,
  ): Promise<Quote> {
    const visit = await this.visitDao.findByIdAndAdvisor(visitId, advisorId);

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    return this.createQuote.execute({
      ...command,
      clientId: visit.clientId,
    });
  }
}
