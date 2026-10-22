export class InvalidCredentialsError extends Error {
  constructor(message = 'Incorrect email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}
