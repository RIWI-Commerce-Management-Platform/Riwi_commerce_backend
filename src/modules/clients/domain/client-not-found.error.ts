export class ClientNotFoundError extends Error {
  constructor(id: number | string) {
    super(`Client with id "${id}" was not found`);
    this.name = 'ClientNotFoundError';
  }
}
