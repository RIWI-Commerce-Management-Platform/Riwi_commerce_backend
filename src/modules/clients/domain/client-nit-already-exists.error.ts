export class ClientNitAlreadyExistsError extends Error {
  constructor(nit: string) {
    super(`A client with NIT "${nit}" already exists`);
    this.name = 'ClientNitAlreadyExistsError';
  }
}

