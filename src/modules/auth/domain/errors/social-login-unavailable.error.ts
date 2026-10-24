export class SocialLoginUnavailableError extends Error {
  constructor(provider: string, reason?: string) {
    super(reason || `Sign-in with ${provider} is not available`);
    this.name = 'SocialLoginUnavailableError';
  }
}
