import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../domain/user-role.enum.js';
import { AccountOrmEntity } from '../infrastructure/account.orm-entity.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { AuthTokenService, AuthTokens } from './auth-token.service.js';
import { LoginDto } from '../presentation/dto/login.dto.js';
import { RegisterDto } from '../presentation/dto/register.dto.js';

type AuthUser = Pick<
  UserOrmEntity,
  'id' | 'name' | 'email' | 'role' | 'zoneId'
>;

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(AccountOrmEntity)
    private readonly accountRepository: Repository<AccountOrmEntity>,
    private readonly tokenService: AuthTokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (
      !dto ||
      typeof dto.name !== 'string' ||
      dto.name.trim().length < 2 ||
      typeof dto.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email) ||
      typeof dto.password !== 'string' ||
      dto.password.length < 8 ||
      dto.password.length > 128
    ) {
      throw new BadRequestException('Invalid name, email, or password');
    }

    const email = dto.email.trim().toLowerCase();
    if (await this.userRepository.findOneBy({ email })) {
      throw new ConflictException('An account with this email already exists');
    }

    const id = randomUUID();
    const password = await hashPassword(dto.password);
    let user: UserOrmEntity;

    try {
      user = await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(UserOrmEntity);
        const accounts = manager.getRepository(AccountOrmEntity);
        const createdUser = users.create({
          id,
          name: dto.name.trim(),
          email,
          emailVerified: false,
          image: null,
          role: UserRole.ASESOR,
          zoneId: null,
        });
        await users.save(createdUser);

        const now = new Date();
        await accounts.save(
          accounts.create({
            id: randomUUID(),
            accountId: id,
            providerId: 'credential',
            userId: id,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            password,
            createdAt: now,
            updatedAt: now,
          }),
        );

        return createdUser;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    if (
      !dto ||typeof dto.email !== 'string' || typeof dto.password !== 'string') {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const email = dto.email.trim().toLowerCase();
    const account = await this.accountRepository.findOne({
      where: { providerId: 'credential', user: { email } },
      relations: { user: true },
    });

    if (
      !account?.password ||
      !(await verifyPassword({
        hash: account.password,
        password: dto.password,
      }))
    ) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    return this.createAuthResponse(account.user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return this.tokenService.refresh(refreshToken);
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.tokenService.revokeSession(userId, sessionId);
  }

  private async createAuthResponse(user: UserOrmEntity): Promise<AuthResponse> {
    const tokens = await this.tokenService.createSession(user.id);
    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        zoneId: user.zoneId,
      },
    };
  }
}
