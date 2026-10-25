export class InvalidVisitObservationsError extends Error {
  constructor(
    readonly length: number,
    readonly maxLength: number,
  ) {
    super(
      `Visit observations must not exceed ${maxLength} characters (received ${length}).`,
    );
    this.name = 'InvalidVisitObservationsError';
  }
}
