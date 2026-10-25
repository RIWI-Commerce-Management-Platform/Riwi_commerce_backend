export class InvalidFollowUpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFollowUpError';
  }
}
