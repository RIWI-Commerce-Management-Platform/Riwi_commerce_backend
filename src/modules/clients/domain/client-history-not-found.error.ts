export class ClientHistoryNotFoundError extends Error {
  constructor(id: number) {
    super(`Client history entry with ID ${id} not found.`);
    this.name = 'ClientHistoryNotFoundError';
  }
}
