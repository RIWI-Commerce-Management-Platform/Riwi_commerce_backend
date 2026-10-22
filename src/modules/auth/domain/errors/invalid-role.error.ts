export class InvalidRoleError extends Error {
  constructor(message = 'The specified role is invalid') {
    super(message);
    this.name = 'InvalidRoleError';
  }
}
