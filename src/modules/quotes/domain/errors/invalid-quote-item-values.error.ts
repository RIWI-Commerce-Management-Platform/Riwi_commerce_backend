export class InvalidQuoteItemValuesError extends Error {
  constructor(productName: string) {
    super(`Product item '${productName}' must have a positive quantity and a unit price >= 0.`);
    this.name = 'InvalidQuoteItemValuesError';
  }
}
