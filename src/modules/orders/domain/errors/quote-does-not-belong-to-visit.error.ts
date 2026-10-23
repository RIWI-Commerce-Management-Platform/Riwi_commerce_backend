export class QuoteDoesNotBelongToVisitError extends Error {
  constructor(quoteId: number, visitId: number) {
    super(`Quote ${quoteId} does not belong to visit ${visitId}.`);
    this.name = 'QuoteDoesNotBelongToVisitError';
  }
}
