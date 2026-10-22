import { Injectable } from '@nestjs/common';
import { QuoteRepository } from '../domain/quote.repository.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { Quote } from '../domain/quote.entity.js';

export interface ChangeQuoteStatusCommand {
  quoteId: number;
  newStatus: QuoteStatus;
  actorId?: number;
}

@Injectable()
export class ChangeQuoteStatusUseCase {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(command: ChangeQuoteStatusCommand): Promise<Quote> {
    const quote = await this.quoteRepository.findById(command.quoteId);
    if (!quote) {
      throw new QuoteNotFoundError(command.quoteId);
    }

    const previousStatus = quote.status;
    quote.changeStatus(command.newStatus);

    const savedQuote = await this.quoteRepository.save(quote);

    await this.activityLogService.record({
      action: 'quote.status_changed',
      entityType: 'quote',
      entityId: savedQuote.id!,
      actorId: command.actorId ?? 1,
      description: `Quote ${savedQuote.quoteNumber} status changed from ${previousStatus} to ${command.newStatus}`,
      metadata: {
        clientId: savedQuote.clientId,
        quoteNumber: savedQuote.quoteNumber,
        previousStatus,
        newStatus: command.newStatus,
      },
    });

    return savedQuote;
  }
}
