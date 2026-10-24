import { Injectable } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './better-auth.adapter.js';

type NodeHeaders = Record<string, string | string[] | undefined>;

@Injectable()
export class BetterAuthGateway {
  getSession(headers: NodeHeaders) {
    return auth.api.getSession({ headers: fromNodeHeaders(headers) });
  }

  requestPasswordReset(email: string, redirectTo: string) {
    return auth.api.requestPasswordReset({
      body: { email, redirectTo },
    });
  }

  resetPassword(token: string, newPassword: string) {
    return auth.api.resetPassword({
      body: { token, newPassword },
    });
  }

  signOut(headers: NodeHeaders): Promise<globalThis.Response> {
    return auth.api.signOut({
      headers: fromNodeHeaders(headers),
      asResponse: true,
    });
  }
}
