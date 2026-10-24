import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { AccountOrmEntity } from '../infrastructure/account.orm-entity.js';
import { AuthTokenService } from './auth-token.service.js';
import { PasswordHasher } from './ports/password-hasher.js';
import { UserRole } from '../domain/user-role.enum.js';
import { AdvisorOrmEntity } from '../../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';

describe('AuthService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const setup = () => {
    const userRepository = {
      findOneBy: vi.fn(),
      save: vi.fn(),
      create: vi.fn((x) => x),
    } as unknown as Repository<UserOrmEntity>;

    const accountRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn((x) => x),
    } as unknown as Repository<AccountOrmEntity>;

    const tokenService = {
      createSession: vi.fn().mockResolvedValue({
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
      }),
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      revokeAllSessions: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthTokenService;

    const passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed-password'),
      verify: vi.fn().mockResolvedValue(true),
    } as unknown as PasswordHasher;

    const advisorRepo = {
      exists: vi.fn().mockResolvedValue(false),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
      save: vi.fn(),
    };

    const clientRepo = {
      exists: vi.fn().mockResolvedValue(false),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
      save: vi.fn(),
    };

    const dataSource = {
      getRepository: vi.fn((entity) => {
        if (entity === AdvisorOrmEntity) return advisorRepo;
        if (entity === ClientOrmEntity) return clientRepo;
        if (entity === UserOrmEntity) return userRepository;
        if (entity === AccountOrmEntity) return accountRepository;
        return null;
      }),
      transaction: vi.fn(async (cb) => {
        const manager = {
          getRepository: (entity: any) => dataSource.getRepository(entity),
        };
        return cb(manager);
      }),
    } as unknown as DataSource;

    const service = new AuthService(
      dataSource,
      userRepository,
      accountRepository,
      tokenService,
      passwordHasher,
    );

    return {
      service,
      userRepository,
      accountRepository,
      tokenService,
      passwordHasher,
      advisorRepo,
      clientRepo,
      dataSource,
    };
  };

  describe('onModuleInit', () => {
    it('should return early when neither email nor password is set', async () => {
      const { service } = setup();
      delete process.env.INITIAL_ADMIN_EMAIL;
      delete process.env.INITIAL_ADMIN_PASSWORD;

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });

    it('should throw if only email or only password is set', async () => {
      const { service } = setup();
      process.env.INITIAL_ADMIN_EMAIL = 'admin@riwi.com';
      delete process.env.INITIAL_ADMIN_PASSWORD;

      await expect(service.onModuleInit()).rejects.toThrow(
        'INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be configured together',
      );
    });

    it('should throw if email format is invalid or password too short', async () => {
      const { service } = setup();
      process.env.INITIAL_ADMIN_EMAIL = 'invalid-email';
      process.env.INITIAL_ADMIN_PASSWORD = 'short';

      await expect(service.onModuleInit()).rejects.toThrow(
        'Initial administrator email must be valid and password must be at least 12 characters',
      );
    });

    it('should return if valid existing admin account is found and not linked', async () => {
      const { service, userRepository } = setup();
      process.env.INITIAL_ADMIN_EMAIL = 'admin@riwi.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'LongEnoughPassword123!';

      (userRepository.findOneBy as any).mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ADMINISTRADOR,
      });

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });

    it('should throw if existing account has a non-administrator role', async () => {
      const { service, userRepository } = setup();
      process.env.INITIAL_ADMIN_EMAIL = 'admin@riwi.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'LongEnoughPassword123!';

      (userRepository.findOneBy as any).mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ASESOR,
      });

      await expect(service.onModuleInit()).rejects.toThrow(
        'INITIAL_ADMIN_EMAIL already belongs to a non-administrator account',
      );
    });

    it('should throw if existing administrator account is linked to advisor or client', async () => {
      const { service, userRepository, advisorRepo } = setup();
      process.env.INITIAL_ADMIN_EMAIL = 'admin@riwi.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'LongEnoughPassword123!';

      (userRepository.findOneBy as any).mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ADMINISTRADOR,
      });
      advisorRepo.exists.mockResolvedValue(true);

      await expect(service.onModuleInit()).rejects.toThrow(
        'The initial administrator account must not be linked to an advisor or client',
      );
    });

    it('should create new admin user and credential account when none exists', async () => {
      const { service, userRepository, dataSource } = setup();
      process.env.INITIAL_ADMIN_EMAIL = 'admin@riwi.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'LongEnoughPassword123!';
      process.env.INITIAL_ADMIN_NAME = 'Super Admin';

      (userRepository.findOneBy as any).mockResolvedValue(null);

      await service.onModuleInit();
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if dto is invalid', async () => {
      const { service } = setup();
      await expect(service.register(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.register({ name: 'A', email: 'not-an-email', password: '123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user email already exists', async () => {
      const { service, userRepository } = setup();
      (userRepository.findOneBy as any).mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({
          name: 'Advisor User',
          email: 'adv@riwi.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if no unlinked profile is found for email', async () => {
      const { service, userRepository, advisorRepo, clientRepo } = setup();
      (userRepository.findOneBy as any).mockResolvedValue(null);
      advisorRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      clientRepo.createQueryBuilder().getMany.mockResolvedValue([]);

      await expect(
        service.register({
          name: 'Advisor User',
          email: 'adv@riwi.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully register and link to an advisor profile', async () => {
      const { service, userRepository, advisorRepo, clientRepo } = setup();
      (userRepository.findOneBy as any).mockResolvedValue(null);

      const mockAdvisor = { id: 1, correo: 'adv@riwi.com', idUsuario: null };
      advisorRepo.createQueryBuilder().getMany.mockResolvedValue([mockAdvisor]);
      clientRepo.createQueryBuilder().getMany.mockResolvedValue([]);

      const result = await service.register({
        name: 'Advisor User',
        email: 'adv@riwi.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('adv@riwi.com');
      expect(result.user.role).toBe(UserRole.ASESOR);
    });

    it('should successfully register and link to a client profile', async () => {
      const { service, userRepository, advisorRepo, clientRepo } = setup();
      (userRepository.findOneBy as any).mockResolvedValue(null);

      const mockClient = { id: 2, email: 'client@riwi.com', idUsuario: null };
      advisorRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      clientRepo.createQueryBuilder().getMany.mockResolvedValue([mockClient]);

      const result = await service.register({
        name: 'Client User',
        email: 'client@riwi.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('client@riwi.com');
      expect(result.user.role).toBe(UserRole.CLIENTE);
    });

    it('should handle unique constraint collision during registration', async () => {
      const { service, userRepository, advisorRepo, dataSource } = setup();
      (userRepository.findOneBy as any).mockResolvedValue(null);
      advisorRepo
        .createQueryBuilder()
        .getMany.mockResolvedValue([{ id: 1, correo: 'adv@riwi.com' }]);

      const queryError = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      (queryError as any).driverError = {
        code: '23505',
        constraint: 'fk_advisor_id_usuario',
      };
      (dataSource.transaction as any).mockRejectedValue(queryError);

      await expect(
        service.register({
          name: 'Advisor User',
          email: 'adv@riwi.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if credentials are missing or not strings', async () => {
      const { service } = setup();
      await expect(service.login(null as any)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        service.login({ email: '', password: 123 as any }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is not found or has no password', async () => {
      const { service, accountRepository } = setup();
      (accountRepository.findOne as any).mockResolvedValue(null);

      await expect(
        service.login({ email: 'user@riwi.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not verify', async () => {
      const { service, accountRepository, passwordHasher } = setup();
      (accountRepository.findOne as any).mockResolvedValue({
        password: 'hash',
        user: { id: 'u1', email: 'user@riwi.com' },
      });
      (passwordHasher.verify as any).mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@riwi.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return auth response on successful credentials', async () => {
      const { service, accountRepository, passwordHasher, tokenService } =
        setup();
      (accountRepository.findOne as any).mockResolvedValue({
        password: 'hash',
        user: {
          id: 'u1',
          name: 'Valid User',
          email: 'user@riwi.com',
          role: UserRole.ASESOR,
          zoneId: 2,
        },
      });
      (passwordHasher.verify as any).mockResolvedValue(true);

      const result = await service.login({
        email: 'user@riwi.com',
        password: 'CorrectPassword123!',
      });

      expect(tokenService.createSession).toHaveBeenCalledWith('u1');
      expect(result.accessToken).toBe('mock-access');
      expect(result.user.email).toBe('user@riwi.com');
    });
  });

  describe('refresh, logout, and revokeAllSessions', () => {
    it('should refresh tokens via tokenService', async () => {
      const { service, tokenService } = setup();
      const tokens = await service.refresh('old-refresh');
      expect(tokenService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(tokens.accessToken).toBe('new-access');
    });

    it('should revoke single session on logout', async () => {
      const { service, tokenService } = setup();
      await service.logout('u1', 's1');
      expect(tokenService.revokeSession).toHaveBeenCalledWith('u1', 's1');
    });

    it('should revoke all sessions for a user', async () => {
      const { service, tokenService } = setup();
      await service.revokeAllSessions('u1');
      expect(tokenService.revokeAllSessions).toHaveBeenCalledWith('u1');
    });
  });
});
