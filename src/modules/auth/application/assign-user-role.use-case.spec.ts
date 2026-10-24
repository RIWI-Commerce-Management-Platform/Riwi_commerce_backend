import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { AssignUserRoleUseCase } from './assign-user-role.use-case.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { AdvisorOrmEntity } from '../../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';
import { UserRole } from '../domain/user-role.enum.js';
import { InvalidRoleError } from '../domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';

describe('AssignUserRoleUseCase', () => {
  const setup = (advisorRepoMock?: any, clientRepoMock?: any) => {
    const userRepo = {
      findOneBy: vi.fn(),
      save: vi.fn(),
    } as unknown as Repository<UserOrmEntity>;

    const zoneRepo = {
      findOneBy: vi.fn(),
    } as unknown as Repository<ZoneOrmEntity>;

    const advRepo =
      advisorRepoMock ??
      ({
        findOneBy: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      } as unknown as Repository<AdvisorOrmEntity>);

    const cliRepo =
      clientRepoMock ??
      ({
        findOneBy: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      } as unknown as Repository<ClientOrmEntity>);

    const useCase = new AssignUserRoleUseCase(
      userRepo,
      zoneRepo,
      advRepo,
      cliRepo,
    );
    return {
      useCase,
      userRepo,
      zoneRepo,
      advisorRepo: advRepo,
      clientRepo: cliRepo,
    };
  };

  it('should throw InvalidRoleError when role is not a valid UserRole', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 'u1',
        role: 'SUPER_ADMIN' as any,
      }),
    ).rejects.toThrow(InvalidRoleError);
  });

  it('should throw ZoneRequiredError when role is DIRECTOR_REGIONAL but zoneId is missing', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 'u1',
        role: UserRole.DIRECTOR_REGIONAL,
      }),
    ).rejects.toThrow(ZoneRequiredError);
  });

  it('should throw ZoneRequiredError when role is DIRECTOR_REGIONAL and zoneId is not an integer', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 'u1',
        role: UserRole.DIRECTOR_REGIONAL,
        zoneId: 3.14 as any,
      }),
    ).rejects.toThrow(ZoneRequiredError);
  });

  it('should throw ZoneNotFoundError when zone does not exist', async () => {
    const { useCase, zoneRepo } = setup();
    (zoneRepo.findOneBy as any).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'u1',
        role: UserRole.DIRECTOR_REGIONAL,
        zoneId: 99,
      }),
    ).rejects.toThrow(ZoneNotFoundError);
  });

  it('should throw UnexpectedZoneError when role is not DIRECTOR_REGIONAL but zoneId is provided', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 'u1',
        role: UserRole.ASESOR,
        zoneId: 5,
      }),
    ).rejects.toThrow(UnexpectedZoneError);
  });

  it('should throw UserNotFoundError when user is not found', async () => {
    const { useCase, userRepo } = setup();
    (userRepo.findOneBy as any).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing-user',
        role: UserRole.ADMIN,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should assign DIRECTOR_REGIONAL role with zone successfully', async () => {
    const { useCase, userRepo, zoneRepo } = setup();
    const mockZone = { id: 10, name: 'Zona Norte' } as ZoneOrmEntity;
    const mockUser = {
      id: 'u1',
      role: UserRole.ASESOR,
      zoneId: null,
    } as UserOrmEntity;

    (zoneRepo.findOneBy as any).mockResolvedValue(mockZone);
    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    const result = await useCase.execute({
      userId: 'u1',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 10,
    });

    expect(result).toEqual({
      id: 'u1',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 10,
    });
    expect(mockUser.role).toBe(UserRole.DIRECTOR_REGIONAL);
    expect(mockUser.zoneId).toBe(10);
    expect(userRepo.save).toHaveBeenCalledWith(mockUser);
  });

  it('should assign non-director role without zone successfully', async () => {
    const { useCase, userRepo } = setup();
    const mockUser = {
      id: 'u2',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 5,
    } as UserOrmEntity;

    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    const result = await useCase.execute({
      userId: 'u2',
      role: UserRole.ADMIN,
    });

    expect(result).toEqual({
      id: 'u2',
      role: UserRole.ADMIN,
      zoneId: null,
    });
    expect(mockUser.role).toBe(UserRole.ADMIN);
    expect(mockUser.zoneId).toBeNull();
  });

  it('should assign ASESOR role when matching advisor profile exists', async () => {
    const advRepo = {
      findOneBy: vi.fn(),
      save: vi.fn(),
    };
    const { useCase, userRepo } = setup(advRepo);
    const mockUser = {
      id: 'u3',
      email: 'adv@riwi.com',
      role: UserRole.CLIENTE,
    } as UserOrmEntity;
    const mockAdvisor = {
      idAsesor: 1,
      correo: 'adv@riwi.com',
      idUsuario: 'u3',
    };

    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (advRepo.findOneBy as any).mockResolvedValue(mockAdvisor);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    const result = await useCase.execute({
      userId: 'u3',
      role: UserRole.ASESOR,
    });
    expect(result.role).toBe(UserRole.ASESOR);
  });

  it('should assign CLIENTE role when matching client profile exists', async () => {
    const cliRepo = {
      findOneBy: vi.fn(),
      save: vi.fn(),
    };
    const { useCase, userRepo } = setup(undefined, cliRepo);
    const mockUser = {
      id: 'u4',
      email: 'cli@riwi.com',
      role: UserRole.ASESOR,
    } as UserOrmEntity;
    const mockClient = { id: 2, email: 'cli@riwi.com', idUsuario: 'u4' };

    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (cliRepo.findOneBy as any).mockResolvedValue(mockClient);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    const result = await useCase.execute({
      userId: 'u4',
      role: UserRole.CLIENTE,
    });
    expect(result.role).toBe(UserRole.CLIENTE);
  });

  it('should unlink advisor and client when changing to DIRECTOR_REGIONAL or ADMINISTRADOR', async () => {
    const advRepo = { findOneBy: vi.fn(), save: vi.fn() };
    const cliRepo = { findOneBy: vi.fn(), save: vi.fn() };
    const { useCase, userRepo, zoneRepo } = setup(advRepo, cliRepo);

    const mockUser = {
      id: 'u5',
      email: 'admin@riwi.com',
      role: UserRole.ASESOR,
    } as UserOrmEntity;
    const mockAdvisor = {
      idAsesor: 1,
      correo: 'admin@riwi.com',
      idUsuario: 'u5',
    };
    const mockClient = { id: 2, email: 'admin@riwi.com', idUsuario: 'u5' };

    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (advRepo.findOneBy as any).mockResolvedValue(mockAdvisor);
    (cliRepo.findOneBy as any).mockResolvedValue(mockClient);
    (zoneRepo.findOneBy as any).mockResolvedValue({ id: 1 } as ZoneOrmEntity);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    await useCase.execute({
      userId: 'u5',
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 1,
    });
    expect(mockAdvisor.idUsuario).toBeNull();
    expect(mockClient.idUsuario).toBeNull();
    expect(advRepo.save).toHaveBeenCalledWith(mockAdvisor);
    expect(cliRepo.save).toHaveBeenCalledWith(mockClient);

    await useCase.execute({ userId: 'u5', role: UserRole.ADMINISTRADOR });
    expect(advRepo.save).toHaveBeenCalled();
  });
});
