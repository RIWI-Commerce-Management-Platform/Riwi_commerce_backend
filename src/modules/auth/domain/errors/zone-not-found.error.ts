export class ZoneNotFoundError extends Error {
  constructor(message = 'The specified zone does not exist') {
    super(message);
    this.name = 'ZoneNotFoundError';
  }
}
