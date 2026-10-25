import { Injectable } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { SocialLoginUnavailableError } from '../domain/errors/social-login-unavailable.error.js';
import { extractSetCookies, SetCookieHeaders } from './extract-set-cookies.js';

export interface StartMicrosoftLoginInput {
  callbackURL: string;
  errorCallbackURL?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface StartMicrosoftLoginResult {
  url: string;
  setCookieHeaders: SetCookieHeaders;
}

/**
 * HU-10: returns the Microsoft 365 authorization URL. Better Auth sets a
 * state cookie that must be forwarded; Microsoft then redirects back to
 * /api/auth/callback/microsoft, which creates the session and sends the
 * browser to `callbackURL`.
 */
@Injectable()
export class StartMicrosoftLoginUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(
    input: StartMicrosoftLoginInput,
  ): Promise<StartMicrosoftLoginResult> {
    let response: globalThis.Response;
    try {
      response = await this.authService.api.signInSocial({
        body: {
          provider: 'microsoft',
          callbackURL: input.callbackURL,
          errorCallbackURL: input.errorCallbackURL,
        },
        headers: fromNodeHeaders(input.headers),
        asResponse: true,
      });
    } catch (error: any) {
      throw new SocialLoginUnavailableError(
        'Microsoft',
        error?.body?.message || error?.message,
      );
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.url) {
      throw new SocialLoginUnavailableError('Microsoft', data?.message);
    }

    return { url: data.url, setCookieHeaders: extractSetCookies(response) };
  }
}
