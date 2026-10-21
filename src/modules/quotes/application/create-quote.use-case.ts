import { Injectable } from '@nestjs/common';
import { Quote } from '../domain/quote.entity.js';
import { QuoteItem } from '../domain/quote-item.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { EmptyQuoteItemsError } from '../domain/errors/empty-quote-items.error.js';
import { InvalidQuoteItemValuesError } from '../domain/errors/invalid-quote-item-values.error.js';
import { CreateQuoteCommand } from './dto/create-quote.command.js';

@Injectable()
export class CreateQuoteUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) {}

  async execute(command: CreateQuoteCommand): Promise<Quote> {
    this.validateCommand(command);

    const nextQuoteNumber = await this.quoteRepository.generateNextQuoteNumber();

    const items = command.items.map((itemCommand) => {
      const itemSubtotal = this.roundToTwoDecimals(
        itemCommand.quantity * itemCommand.unitPrice,
      );

      return new QuoteItem({
        productName: itemCommand.productName,
        quantity: itemCommand.quantity,
        unitPrice: itemCommand.unitPrice,
        subtotal: itemSubtotal,
      });
    });

    const quoteSubtotal = this.roundToTwoDecimals(
      items.reduce((acc, item) => acc + item.subtotal, 0),
    );
    const quoteTotal = quoteSubtotal;
    const now = new Date();

    const quote = new Quote({
      quoteNumber: nextQuoteNumber,
      clientId: command.clientId,
      status: QuoteStatus.DRAFT,
      subtotal: quoteSubtotal,
      total: quoteTotal,
      notes: command.notes ?? null,
      documentKey: command.documentKey ?? null,
      items,
      createdAt: now,
      updatedAt: now,
    });

    return this.quoteRepository.save(quote);
  }

  private validateCommand(command: CreateQuoteCommand): void {
    if (!command.items || command.items.length === 0) {
      throw new EmptyQuoteItemsError();
    }

    for (const item of command.items) {
      if (item.quantity <= 0 || item.unitPrice < 0) {
        throw new InvalidQuoteItemValuesError(item.productName);
      }
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
