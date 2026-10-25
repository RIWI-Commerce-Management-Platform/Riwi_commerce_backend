import { Injectable } from '@nestjs/common';
import { QuoteDao } from '../domain/quote.dao.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { Quote } from '../domain/quote.entity.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

export interface ChangeQuoteStatusCommand {
  quoteId: number;
  newStatus: QuoteStatus;
  actorId: number;
  /** With an actor, a quote outside their scope is not found (HU-06). */
  actor?: CurrentActor;
}

@Injectable()
export class ChangeQuoteStatusUseCase {
  constructor(
    private readonly quoteDao: QuoteDao,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(command: ChangeQuoteStatusCommand): Promise<Quote> {
    const quote = await this.quoteDao.findById(
      command.quoteId,
      scopeForActor(command.actor),
    );
    if (!quote) {
      throw new QuoteNotFoundError(command.quoteId);
    }

    const previousStatus = quote.status;
    quote.changeStatus(command.newStatus);

    const savedQuote = await this.quoteDao.save(quote);

    await this.activityLogService.record({
      action: 'quote.status_changed',
      entityType: 'quote',
      entityId: savedQuote.id!,
      actorId: command.actorId,
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
