export class ClientNotFoundError extends Error {
  constructor(clientId: number) {
    super(`Client with id "${clientId}" was not found.`);
    this.name = 'ClientNotFoundError';
  }
}
