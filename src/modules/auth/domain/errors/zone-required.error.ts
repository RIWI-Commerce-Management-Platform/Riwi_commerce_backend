export class ZoneRequiredError extends Error {
  constructor(message = 'A valid zoneId must be provided for a Regional Director') {
    super(message);
    this.name = 'ZoneRequiredError';
  }
}
