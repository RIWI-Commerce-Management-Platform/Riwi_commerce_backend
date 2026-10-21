export class EmptyQuoteItemsError extends Error {
  constructor() {
    super('A quote must contain at least one product item.');
    this.name = 'EmptyQuoteItemsError';
  }
}
