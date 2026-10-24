export class AdvisorNotFoundError extends Error {
  constructor(userId: number) {
    super(`Advisor with user id "${userId}" was not found`);
    this.name = 'AdvisorNotFoundError';
  }
}

export class AdvisorEmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
    this.name = 'AdvisorEmailAlreadyExistsError';
  }
}

export class AdvisorZoneNotFoundError extends Error {
  constructor(zoneId: number) {
    super(`Zone with id "${zoneId}" was not found`);
    this.name = 'AdvisorZoneNotFoundError';
  }
}

export class AdvisorAccountCreationError extends Error {
  constructor(reason?: string) {
    super(reason || 'The advisor account could not be created');
    this.name = 'AdvisorAccountCreationError';
  }
}
