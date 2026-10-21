export class ClientContactNotFoundError extends Error {
  constructor(id: number) {
    super(`Client contact with ID "${id}" was not found`);
    this.name = 'ClientContactNotFoundError';
  }
}
