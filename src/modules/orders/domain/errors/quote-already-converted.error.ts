export class QuoteAlreadyConvertedError extends Error {
  constructor(quoteId: number, orderNumber?: string) {
    super(
      `Quote with ID ${quoteId} has already been converted to an order${orderNumber ? ` (${orderNumber})` : ''}.`,
    );
    this.name = 'QuoteAlreadyConvertedError';
  }
}
