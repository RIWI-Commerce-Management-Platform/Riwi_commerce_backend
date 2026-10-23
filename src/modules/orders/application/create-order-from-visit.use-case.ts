import { Injectable, NotFoundException } from '@nestjs/common';
import { VisitDao } from '../../visit/domain/dao/visit.dao.js';
import { QuoteRepository } from '../../quotes/domain/quote.repository.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { Order } from '../domain/order.entity.js';
import { QuoteDoesNotBelongToVisitError } from '../domain/errors/quote-does-not-belong-to-visit.error.js';
import { ConvertQuoteToOrderUseCase } from './convert-quote-to-order.use-case.js';
import { CreateOrderFromVisitCommand } from './dto/create-order-from-visit.command.js';

@Injectable()
export class CreateOrderFromVisitUseCase {
  constructor(
    private readonly visitDao: VisitDao,
    private readonly quoteRepository: QuoteRepository,
    private readonly convertQuoteToOrder: ConvertQuoteToOrderUseCase,
  ) {}

  async execute(command: CreateOrderFromVisitCommand): Promise<Order> {
    const visit = await this.visitDao.findByIdAndAdvisor(
      command.visitId,
      command.advisorId,
    );

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const quote = await this.quoteRepository.findById(command.quoteId);
    if (!quote) {
      throw new QuoteNotFoundError(command.quoteId);
    }

    if (quote.clientId !== visit.clientId) {
      throw new QuoteDoesNotBelongToVisitError(
        command.quoteId,
        command.visitId,
      );
    }

    return this.convertQuoteToOrder.execute({
      quoteId: command.quoteId,
      actorId: command.advisorId,
    });
  }
}
