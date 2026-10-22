export class InvalidVisitScheduledAtError extends Error {
  constructor() {
    super('The scheduled date and time must be valid.');
    this.name = 'InvalidVisitScheduledAtError';
  }
}
