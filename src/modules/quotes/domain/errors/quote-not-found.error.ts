export class QuoteNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Quote '${identifier}' was not found.`);
    this.name = 'QuoteNotFoundError';
  }
}
