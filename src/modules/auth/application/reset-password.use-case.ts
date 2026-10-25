import { Injectable } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { InvalidResetTokenError } from '../domain/errors/invalid-reset-token.error.js';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/** HU-09: sets the new password with the token from the reset link. */
@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    try {
      await this.authService.api.resetPassword({
        body: { token: input.token, newPassword: input.newPassword },
      });
    } catch (error: any) {
      throw new InvalidResetTokenError(error?.body?.message);
    }
  }
}
