import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';

export interface RequestPasswordResetInput {
  email: string;
  redirectTo: string;
}

/**
 * HU-09: asks Better Auth to email a reset link. It always succeeds from the
 * caller's point of view so the endpoint can't be used to find out which
 * emails are registered.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(private readonly authService: AuthService) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    try {
      await this.authService.api.requestPasswordReset({
        body: { email: input.email, redirectTo: input.redirectTo },
      });
    } catch (error: any) {
      this.logger.error('requestPasswordReset failed', error?.stack ?? error);
    }
  }
}
