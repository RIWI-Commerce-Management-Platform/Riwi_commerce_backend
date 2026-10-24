export class PortfolioNotFoundError extends Error {
  constructor(portfolioId: number) {
    super(`Portfolio with id "${portfolioId}" was not found or is inactive`);
    this.name = 'PortfolioNotFoundError';
  }
}

export class ClientPortfolioAlreadyAssignedError extends Error {
  constructor(clientId: number, portfolioId: number) {
    super(
      `Portfolio "${portfolioId}" is already associated with client "${clientId}"`,
    );
    this.name = 'ClientPortfolioAlreadyAssignedError';
  }
}

export class ClientPortfolioNotFoundError extends Error {
  constructor(clientId: number, portfolioId: number) {
    super(
      `Portfolio "${portfolioId}" is not associated with client "${clientId}"`,
    );
    this.name = 'ClientPortfolioNotFoundError';
  }
}
