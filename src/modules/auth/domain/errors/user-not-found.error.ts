export class UserNotFoundError extends Error {
  constructor(message = 'The specified user does not exist') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}
