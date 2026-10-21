import { VisitStatus } from '../visit.entity.js';

export class InvalidVisitStatusError extends Error {
  constructor(
    private readonly current: VisitStatus,
    private readonly attempted: string,
  ) {
    super(
      `Visit in status ${current} cannot be ${attempted}. Current status: ${current}.`,
    );
    this.name = 'InvalidVisitStatusError';
  }

  get currentStatus(): VisitStatus {
    return this.current;
  }

  get attemptedAction(): string {
    return this.attempted;
  }
}
