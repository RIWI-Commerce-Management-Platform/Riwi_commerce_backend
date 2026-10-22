import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { RegistrationFailedError } from '../domain/errors/registration-failed.error.js';
import { extractSetCookies, SetCookieHeaders } from './extract-set-cookies.js';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface RegisterResult {
  data: unknown;
  setCookieHeaders: SetCookieHeaders;
}

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(private readonly authService: AuthService) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    let response: globalThis.Response;
    try {
      response = await this.authService.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        headers: fromNodeHeaders(input.headers),
        asResponse: true,
      });
    } catch (error: any) {
      this.logger.error('signUpEmail threw unexpectedly', error?.stack ?? error);
      throw new RegistrationFailedError(
        error?.body?.message || error?.message,
      );
    }

    const setCookieHeaders = extractSetCookies(response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RegistrationFailedError(
        errorData?.message || errorData?.statusText,
      );
    }

    return { data: await response.json(), setCookieHeaders };
  }
}
