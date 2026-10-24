import { Injectable } from '@nestjs/common';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { PasswordHasher } from '../../application/ports/password-hasher.js';

@Injectable()
export class BetterAuthPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hashPassword(password);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return verifyPassword({ hash, password });
  }
}
