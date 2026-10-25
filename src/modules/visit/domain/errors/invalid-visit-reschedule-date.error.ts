export class InvalidVisitRescheduleDateError extends Error {
  constructor(readonly date: Date) {
    super('A visit can only be rescheduled to a valid future date.');
    this.name = 'InvalidVisitRescheduleDateError';
  }
}
