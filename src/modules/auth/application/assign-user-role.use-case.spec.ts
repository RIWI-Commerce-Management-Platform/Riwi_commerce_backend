import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { AssignUserRoleUseCase } from './assign-user-role.use-case.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { UserRole } from '../domain/user-role.enum.js';
import { InvalidRoleError } from '../domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';

describe('AssignUserRoleUseCase', () => {
  const setup = () => {
    const userRepo = {
      findOneBy: vi.fn(),
      save: vi.fn(),
    } as unknown as Repository<UserOrmEntity>;

    const zoneRepo = {
      findOneBy: vi.fn(),
    } as unknown as Repository<ZoneOrmEntity>;

    const useCase = new AssignUserRoleUseCase(userRepo, zoneRepo);
    return { useCase, userRepo, zoneRepo };
  };

  it('should throw InvalidRoleError when role is not a valid UserRole', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 1,
        role: 'SUPER_ADMIN' as any,
      }),
    ).rejects.toThrow(InvalidRoleError);
  });

  it('should throw ZoneRequiredError when role is DIRECTOR_REGIONAL but zoneId is missing', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 1,
        role: UserRole.DIRECTOR_REGIONAL,
      }),
    ).rejects.toThrow(ZoneRequiredError);
  });

  it('should throw ZoneRequiredError when role is DIRECTOR_REGIONAL and zoneId is not an integer', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 1,
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
        userId: 1,
        role: UserRole.DIRECTOR_REGIONAL,
        zoneId: 99,
      }),
    ).rejects.toThrow(ZoneNotFoundError);
  });

  it('should throw UnexpectedZoneError when role is not DIRECTOR_REGIONAL but zoneId is provided', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: 1,
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
        userId: 999,
        role: UserRole.ADMIN,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should assign DIRECTOR_REGIONAL role with zone successfully', async () => {
    const { useCase, userRepo, zoneRepo } = setup();
    const mockZone = { id: 10, name: 'Zona Norte' } as ZoneOrmEntity;
    const mockUser = {
      id: 1,
      role: UserRole.ASESOR,
      zoneId: null,
    } as UserOrmEntity;

    (zoneRepo.findOneBy as any).mockResolvedValue(mockZone);
    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    const result = await useCase.execute({
      userId: 1,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 10,
    });

    expect(result).toEqual({
      id: 1,
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
      id: 2,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 5,
    } as UserOrmEntity;

    (userRepo.findOneBy as any).mockResolvedValue(mockUser);
    (userRepo.save as any).mockImplementation((u: any) => Promise.resolve(u));

    const result = await useCase.execute({
      userId: 2,
      role: UserRole.ADMIN,
    });

    expect(result).toEqual({
      id: 2,
      role: UserRole.ADMIN,
      zoneId: null,
    });
    expect(mockUser.role).toBe(UserRole.ADMIN);
    expect(mockUser.zoneId).toBeNull();
  });
});
