export class InvalidResetTokenError extends Error {
  constructor(message?: string) {
    super(message || 'The password reset link is invalid or has expired');
    this.name = 'InvalidResetTokenError';
  }
}
