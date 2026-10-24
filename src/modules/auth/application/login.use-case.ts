import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error.js';
import { parseAuthResponse, SetCookieHeaders } from './extract-set-cookies.js';

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
  headers: Record<string, string | string[] | undefined>;
}

export interface LoginResult {
  data: unknown;
  setCookieHeaders: SetCookieHeaders;
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(private readonly authService: AuthService) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    let response: globalThis.Response;
    try {
      response = await this.authService.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
          rememberMe: input.rememberMe,
        },
        headers: fromNodeHeaders(input.headers),
        asResponse: true,
      });
    } catch (error: any) {
      this.logger.error(
        'signInEmail threw unexpectedly',
        error?.stack ?? error,
      );
      throw new InvalidCredentialsError(error?.body?.message || error?.message);
    }

    return parseAuthResponse(response, InvalidCredentialsError);
  }
}
