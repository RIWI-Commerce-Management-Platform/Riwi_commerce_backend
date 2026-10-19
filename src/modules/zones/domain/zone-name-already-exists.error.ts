export class ZoneNameAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`A zone named "${name}" already exists`);
    this.name = 'ZoneNameAlreadyExistsError';
  }
}
