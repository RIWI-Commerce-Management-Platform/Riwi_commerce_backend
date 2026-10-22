export class RegistrationFailedError extends Error {
  constructor(message = 'Failed to register user') {
    super(message);
    this.name = 'RegistrationFailedError';
  }
}
