export class UnexpectedZoneError extends Error {
  constructor(message = 'Only a Regional Director can be assigned to a zone') {
    super(message);
    this.name = 'UnexpectedZoneError';
  }
}
