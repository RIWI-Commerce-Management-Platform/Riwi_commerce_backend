import { Injectable } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { extractSetCookies, SetCookieHeaders } from './extract-set-cookies.js';

export interface LogoutResult {
  setCookieHeaders: SetCookieHeaders;
}

@Injectable()
export class LogoutUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<LogoutResult> {
    const response = await this.authService.api.signOut({
      headers: fromNodeHeaders(headers),
      asResponse: true,
    });

    return { setCookieHeaders: extractSetCookies(response) };
  }
}
