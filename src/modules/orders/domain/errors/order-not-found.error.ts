export class OrderNotFoundError extends Error {
  constructor(id: number | string) {
    super(`Order with ID ${id} was not found.`);
    this.name = 'OrderNotFoundError';
  }
}
