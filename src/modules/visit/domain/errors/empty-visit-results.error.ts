export class EmptyVisitResultsError extends Error {
  constructor() {
    super('At least one visit result is required.');
    this.name = 'EmptyVisitResultsError';
  }
}
