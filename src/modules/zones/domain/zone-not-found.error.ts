export class ZoneNotFoundError extends Error {
  constructor(id: number) {
    super(`Zone with ID "${id}" was not found`);
    this.name = 'ZoneNotFoundError';
  }
}
