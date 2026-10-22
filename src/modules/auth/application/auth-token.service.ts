import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { RedisService } from '../infrastructure/redis.service.js';

const TOKEN_ISSUER = 'riwi-commerce';
const TOKEN_AUDIENCE = 'riwi-commerce-api';

type TokenType = 'access' | 'refresh';

interface AuthTokenClaims {
  sub: string;
  sid: string;
  typ: TokenType;
  jti: string;
}

interface SessionRecord {
  userId: string;
  refreshJti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable()
export class AuthTokenService {
  private readonly secret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow<string>('jwt.secret');
    if (this.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    this.accessTtlSeconds = config.getOrThrow<number>('jwt.accessTtlSeconds');
    this.refreshTtlSeconds = config.getOrThrow<number>('jwt.refreshTtlSeconds');
  }

  async createSession(userId: string): Promise<AuthTokens> {
    const sid = randomUUID();
    const refreshJti = randomUUID();
    const tokens = await this.signTokenPair(userId, sid, refreshJti);
    const sessionRecord: SessionRecord = { userId, refreshJti };

    const result: Array<[Error | null, unknown]> | null =
      await this.redis.client
        .multi()
        .set(
          this.sessionKey(sid),
          JSON.stringify(sessionRecord),
          'EX',
          this.refreshTtlSeconds,
        )
        .set(
          this.refreshKey(sid, refreshJti),
          this.hashToken(tokens.refreshToken),
          'EX',
          this.refreshTtlSeconds,
        )
        .exec();

    if (!result || result.some(([error]) => error)) {
      throw new Error('Failed to persist the authentication session in Redis');
    }

    return tokens;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const claims = await this.verifyToken(refreshToken, 'refresh');
    const sessionKey = this.sessionKey(claims.sid);
    const oldRefreshKey = this.refreshKey(claims.sid, claims.jti);
    const rawSession = await this.redis.client.get(sessionKey);
    if (!rawSession) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const session = this.parseSession(rawSession);
    if (session.userId !== claims.sub || session.refreshJti !== claims.jti) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const nextRefreshJti = randomUUID();
    const tokens = await this.signTokenPair(
      claims.sub,
      claims.sid,
      nextRefreshJti,
    );
    const nextSession: SessionRecord = {
      userId: claims.sub,
      refreshJti: nextRefreshJti,
    };

    const rotated = await this.redis.client.eval(
      `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
       if redis.call('GET', KEYS[2]) ~= ARGV[2] then return 0 end
       redis.call('DEL', KEYS[2])
       redis.call('SET', KEYS[3], ARGV[3], 'EX', ARGV[5])
       redis.call('SET', KEYS[1], ARGV[4], 'EX', ARGV[5])
       return 1`,
      3,
      sessionKey,
      oldRefreshKey,
      this.refreshKey(claims.sid, nextRefreshJti),
      rawSession,
      this.hashToken(refreshToken),
      this.hashToken(tokens.refreshToken),
      JSON.stringify(nextSession),
      String(this.refreshTtlSeconds),
    );

    if (rotated !== 1) {
      throw new UnauthorizedException(
        'Refresh token is invalid or has already been used',
      );
    }

    return tokens;
  }

  async authenticateAccess(token: string): Promise<AuthTokenClaims> {
    const claims = await this.verifyToken(token, 'access');
    const rawSession = await this.redis.client.get(this.sessionKey(claims.sid));
    if (!rawSession) {
      throw new UnauthorizedException(
        'Access token session is no longer active',
      );
    }

    const session = this.parseSession(rawSession);
    if (session.userId !== claims.sub) {
      throw new UnauthorizedException('Access token session is invalid');
    }

    return claims;
  }

  async revokeSession(userId: string, sid: string): Promise<void> {
    const sessionKey = this.sessionKey(sid);
    const rawSession = await this.redis.client.get(sessionKey);
    if (!rawSession) {
      return;
    }

    const session = this.parseSession(rawSession);
    if (session.userId !== userId) {
      throw new UnauthorizedException('Session does not belong to this user');
    }

    await this.redis.client.del(
      sessionKey,
      this.refreshKey(sid, session.refreshJti),
    );
  }

  private async signTokenPair(
    userId: string,
    sid: string,
    refreshJti: string,
  ): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, sid, typ: 'access', jti: randomUUID() },
        this.signOptions(this.accessTtlSeconds),
      ),
      this.jwtService.signAsync(
        { sub: userId, sid, typ: 'refresh', jti: refreshJti },
        this.signOptions(this.refreshTtlSeconds),
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTtlSeconds,
    };
  }

  private async verifyToken(
    token: string,
    expectedType: TokenType,
  ): Promise<AuthTokenClaims> {
    let claims: AuthTokenClaims;
    try {
      claims = await this.jwtService.verifyAsync<AuthTokenClaims>(token, {
        secret: this.secret,
        algorithms: ['HS256'],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('JWT is invalid or expired');
    }

    if (
      !claims.sub ||
      !claims.sid ||
      !claims.jti ||
      claims.typ !== expectedType
    ) {
      throw new UnauthorizedException(
        'JWT has an invalid token type or payload',
      );
    }

    return claims;
  }

  private signOptions(expiresIn: number) {
    return {
      secret: this.secret,
      algorithm: 'HS256' as const,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn,
    };
  }

  private parseSession(value: string): SessionRecord {
    let session: unknown;
    try {
      session = JSON.parse(value);
    } catch {
      throw new UnauthorizedException('Authentication session is invalid');
    }

    if (
      !session ||
      typeof session !== 'object' ||
      !('userId' in session) ||
      typeof session.userId !== 'string' ||
      !('refreshJti' in session) ||
      typeof session.refreshJti !== 'string'
    ) {
      throw new UnauthorizedException('Authentication session is invalid');
    }

    return session as SessionRecord;
  }

  private sessionKey(sid: string): string {
    return `auth:session:${sid}`;
  }

  private refreshKey(sid: string, jti: string): string {
    return `auth:refresh:${sid}:${jti}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
