export class QuoteNotApprovedForOrderError extends Error {
  constructor(quoteNumber: string, status: string) {
    super(
      `Quote ${quoteNumber} with status '${status}' cannot be converted to an order. Only APPROVED quotes can be converted.`,
    );
    this.name = 'QuoteNotApprovedForOrderError';
  }
}
