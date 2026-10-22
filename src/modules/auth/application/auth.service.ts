import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../domain/user-role.enum.js';
import { AccountOrmEntity } from '../infrastructure/account.orm-entity.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';
import { AuthTokenService, AuthTokens } from './auth-token.service.js';
import { PasswordHasher } from './ports/password-hasher.js';
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
export class AuthService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(AccountOrmEntity)
    private readonly accountRepository: Repository<AccountOrmEntity>,
    private readonly tokenService: AuthTokenService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (Boolean(email) !== Boolean(password)) {
      throw new Error(
        'INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be configured together',
      );
    }
    if (!email || !password) {
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
      throw new Error(
        'Initial administrator email must be valid and password must be at least 12 characters',
      );
    }

    const existing = await this.userRepository.findOneBy({ email });
    if (existing) {
      if (existing.role !== UserRole.ADMINISTRADOR) {
        throw new Error(
          'INITIAL_ADMIN_EMAIL already belongs to a non-administrator account',
        );
      }
      const linked = await Promise.all([
        this.dataSource
          .getRepository(AdvisorOrmEntity)
          .exists({ where: { idUsuario: existing.id } }),
        this.dataSource
          .getRepository(ClientOrmEntity)
          .exists({ where: { idUsuario: existing.id } }),
      ]);
      if (linked.some(Boolean)) {
        throw new Error(
          'The initial administrator account must not be linked to an advisor or client',
        );
      }
      return;
    }

    const id = randomUUID();
    const hash = await this.passwordHasher.hash(password);
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(UserOrmEntity).save(
        manager.getRepository(UserOrmEntity).create({
          id,
          name: process.env.INITIAL_ADMIN_NAME?.trim() || 'Administrador',
          email,
          emailVerified: true,
          image: null,
          role: UserRole.ADMINISTRADOR,
          zoneId: null,
        }),
      );
      await manager.getRepository(AccountOrmEntity).save(
        manager.getRepository(AccountOrmEntity).create({
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
          password: hash,
          createdAt: now,
          updatedAt: now,
        }),
      );
    });
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUser }> {
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

    const [advisors, clients] = await Promise.all([
      this.dataSource
        .getRepository(AdvisorOrmEntity)
        .createQueryBuilder('advisor')
        .where('LOWER(advisor.correo) = :email', { email })
        .andWhere('advisor.idUsuario IS NULL')
        .take(2)
        .getMany(),
      this.dataSource
        .getRepository(ClientOrmEntity)
        .createQueryBuilder('client')
        .where('LOWER(client.email) = :email', { email })
        .andWhere('client.idUsuario IS NULL')
        .take(2)
        .getMany(),
    ]);
    if (advisors.length + clients.length !== 1) {
      throw new BadRequestException(
        'Registration requires one unlinked advisor or client record with the same email',
      );
    }

    const id = randomUUID();
    const password = await this.passwordHasher.hash(dto.password);
    let user: UserOrmEntity;

    try {
      user = await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(UserOrmEntity);
        const accounts = manager.getRepository(AccountOrmEntity);
        const advisorRepository = manager.getRepository(AdvisorOrmEntity);
        const clientRepository = manager.getRepository(ClientOrmEntity);
        const advisor = advisors[0];
        const client = clients[0];
        const createdUser = users.create({
          id,
          name: dto.name.trim(),
          email,
          emailVerified: false,
          image: null,
          role: advisor ? UserRole.ASESOR : UserRole.CLIENTE,
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

        if (advisor) {
          advisor.idUsuario = id;
          await advisorRepository.save(advisor);
        } else if (client) {
          client.idUsuario = id;
          await clientRepository.save(client);
        }

        return createdUser;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        const constraint =
          'constraint' in error.driverError &&
          typeof error.driverError.constraint === 'string'
            ? error.driverError.constraint
            : '';
        if (constraint.includes('id_usuario')) {
          throw new ConflictException(
            'The advisor or client profile is already linked to an account',
          );
        }
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        zoneId: user.zoneId,
      },
    };
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
      !(await this.passwordHasher.verify(dto.password, account.password))
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

  async revokeAllSessions(userId: string): Promise<void> {
    await this.tokenService.revokeAllSessions(userId);
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
