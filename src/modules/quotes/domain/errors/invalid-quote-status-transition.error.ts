import { QuoteStatus } from '../quote-status.enum.js';

export class InvalidQuoteStatusTransitionError extends Error {
  constructor(currentStatus: QuoteStatus, newStatus: QuoteStatus) {
    super(
      `Cannot transition quote status from "${currentStatus}" to "${newStatus}".`,
    );
    this.name = 'InvalidQuoteStatusTransitionError';
  }
}
