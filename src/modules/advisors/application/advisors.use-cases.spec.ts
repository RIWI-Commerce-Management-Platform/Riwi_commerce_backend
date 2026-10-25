import { describe, expect, it, vi } from 'vitest';
import { Advisor } from '../domain/advisor.entity.js';
import {
  AdvisorEmailAlreadyExistsError,
  AdvisorNotFoundError,
  AdvisorZoneNotFoundError,
} from '../domain/advisor.errors.js';
import { CreateAdvisorUseCase } from './create-advisor.use-case.js';
import { ListAdvisorsUseCase } from './list-advisors.use-case.js';
import { GetAdvisorUseCase } from './get-advisor.use-case.js';
import { UpdateAdvisorUseCase } from './update-advisor.use-case.js';
import { ChangeAdvisorStatusUseCase } from './change-advisor-status.use-case.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

const buildAdvisor = (overrides: Partial<Advisor> = {}) =>
  new Advisor({
    userId: 5,
    name: 'Laura',
    email: 'laura@c360.co',
    phone: null,
    documentNumber: null,
    zoneId: 1,
    weeklyVisitGoal: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

const buildDao = (advisor: Advisor | null = buildAdvisor()) => ({
  findById: vi.fn().mockResolvedValue(advisor),
  findPaginated: vi.fn().mockResolvedValue({ data: [], meta: {} }),
  save: vi.fn(async (a: Advisor) => a),
  isEmailTaken: vi.fn().mockResolvedValue(false),
  zoneExists: vi.fn().mockResolvedValue(true),
});

const buildAccountPort = () => ({
  createAccount: vi.fn().mockResolvedValue(5),
  revokeSessions: vi.fn().mockResolvedValue(undefined),
});

describe('CreateAdvisorUseCase', () => {
  it('creates the account and fills the advisor profile', async () => {
    const dao = buildDao(buildAdvisor({ zoneId: null }));
    const accountPort = buildAccountPort();
    const useCase = new CreateAdvisorUseCase(dao as any, accountPort as any);

    const advisor = await useCase.execute({
      name: 'Laura',
      email: ' Laura@C360.co ',
      password: 'Password123!',
      phone: '300',
      zoneId: 2,
      weeklyVisitGoal: 15,
    });

    expect(accountPort.createAccount).toHaveBeenCalledWith({
      name: 'Laura',
      email: 'laura@c360.co',
      password: 'Password123!',
    });
    expect(advisor).toMatchObject({
      phone: '300',
      zoneId: 2,
      weeklyVisitGoal: 15,
      isActive: true,
    });
    expect(dao.save).toHaveBeenCalled();
  });

  it('rejects an email that is already registered', async () => {
    const dao = buildDao();
    dao.isEmailTaken.mockResolvedValue(true);
    const accountPort = buildAccountPort();
    const useCase = new CreateAdvisorUseCase(dao as any, accountPort as any);

    await expect(
      useCase.execute({
        name: 'L',
        email: 'laura@c360.co',
        password: 'Password123!',
      }),
    ).rejects.toThrow(AdvisorEmailAlreadyExistsError);
    expect(accountPort.createAccount).not.toHaveBeenCalled();
  });

  it('rejects an unknown zone', async () => {
    const dao = buildDao();
    dao.zoneExists.mockResolvedValue(false);
    const useCase = new CreateAdvisorUseCase(
      dao as any,
      buildAccountPort() as any,
    );

    await expect(
      useCase.execute({
        name: 'L',
        email: 'l@c.co',
        password: 'Password123!',
        zoneId: 99,
      }),
    ).rejects.toThrow(AdvisorZoneNotFoundError);
  });
});

describe('ListAdvisorsUseCase', () => {
  it('forces the zone of a regional director', async () => {
    const dao = buildDao();
    const useCase = new ListAdvisorsUseCase(dao as any);

    await useCase.execute(
      { page: 1, limit: 10, zoneId: 9 },
      { id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 3 },
    );

    expect(dao.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      zoneId: 3,
    });
  });

  it('keeps the filters of an admin', async () => {
    const dao = buildDao();
    const useCase = new ListAdvisorsUseCase(dao as any);

    await useCase.execute(
      { page: 1, limit: 10, zoneId: 9 },
      { id: 1, role: UserRole.ADMIN, zoneId: null },
    );

    expect(dao.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      zoneId: 9,
    });
  });
});

describe('GetAdvisorUseCase', () => {
  it('returns the advisor', async () => {
    const useCase = new GetAdvisorUseCase(buildDao() as any);
    await expect(useCase.execute(5)).resolves.toMatchObject({ userId: 5 });
  });

  it('hides an advisor of another zone from a director', async () => {
    const useCase = new GetAdvisorUseCase(buildDao() as any);
    await expect(
      useCase.execute(5, {
        id: 2,
        role: UserRole.DIRECTOR_REGIONAL,
        zoneId: 7,
      }),
    ).rejects.toThrow(AdvisorNotFoundError);
  });

  it('fails when the advisor does not exist', async () => {
    const useCase = new GetAdvisorUseCase(buildDao(null) as any);
    await expect(useCase.execute(5)).rejects.toThrow(AdvisorNotFoundError);
  });
});

describe('UpdateAdvisorUseCase', () => {
  it('updates the profile and normalizes the email', async () => {
    const dao = buildDao();
    const useCase = new UpdateAdvisorUseCase(dao as any);

    const advisor = await useCase.execute({
      userId: 5,
      email: 'NEW@c360.co',
      weeklyVisitGoal: 12,
    });

    expect(dao.isEmailTaken).toHaveBeenCalledWith('new@c360.co', 5);
    expect(advisor).toMatchObject({
      email: 'new@c360.co',
      weeklyVisitGoal: 12,
    });
  });

  it('rejects an email used by another user', async () => {
    const dao = buildDao();
    dao.isEmailTaken.mockResolvedValue(true);
    const useCase = new UpdateAdvisorUseCase(dao as any);

    await expect(
      useCase.execute({ userId: 5, email: 'taken@c360.co' }),
    ).rejects.toThrow(AdvisorEmailAlreadyExistsError);
  });

  it('rejects an unknown zone', async () => {
    const dao = buildDao();
    dao.zoneExists.mockResolvedValue(false);
    const useCase = new UpdateAdvisorUseCase(dao as any);

    await expect(useCase.execute({ userId: 5, zoneId: 77 })).rejects.toThrow(
      AdvisorZoneNotFoundError,
    );
  });

  it('fails when the advisor does not exist', async () => {
    const useCase = new UpdateAdvisorUseCase(buildDao(null) as any);
    await expect(useCase.execute({ userId: 5 })).rejects.toThrow(
      AdvisorNotFoundError,
    );
  });
});

describe('ChangeAdvisorStatusUseCase', () => {
  it('deactivates the advisor and signs them out', async () => {
    const accountPort = buildAccountPort();
    const useCase = new ChangeAdvisorStatusUseCase(
      buildDao() as any,
      accountPort as any,
    );

    const advisor = await useCase.execute({ userId: 5, isActive: false });

    expect(advisor.isActive).toBe(false);
    expect(accountPort.revokeSessions).toHaveBeenCalledWith(5);
  });

  it('reactivates the advisor without touching sessions', async () => {
    const accountPort = buildAccountPort();
    const useCase = new ChangeAdvisorStatusUseCase(
      buildDao(buildAdvisor({ isActive: false })) as any,
      accountPort as any,
    );

    const advisor = await useCase.execute({ userId: 5, isActive: true });

    expect(advisor.isActive).toBe(true);
    expect(accountPort.revokeSessions).not.toHaveBeenCalled();
  });

  it('fails when the advisor does not exist', async () => {
    const useCase = new ChangeAdvisorStatusUseCase(
      buildDao(null) as any,
      buildAccountPort() as any,
    );
    await expect(
      useCase.execute({ userId: 5, isActive: false }),
    ).rejects.toThrow(AdvisorNotFoundError);
  });
});

describe('CreateAdvisorUseCase optional data', () => {
  it('stores empty optional fields as null', async () => {
    const dao = buildDao(buildAdvisor({ zoneId: 1, phone: '300' }));
    const useCase = new CreateAdvisorUseCase(
      dao as any,
      buildAccountPort() as any,
    );

    const advisor = await useCase.execute({
      name: 'Laura',
      email: 'laura@c360.co',
      password: 'Password123!',
    });

    expect(dao.zoneExists).not.toHaveBeenCalled();
    expect(advisor).toMatchObject({
      phone: null,
      documentNumber: null,
      zoneId: null,
      weeklyVisitGoal: null,
    });
  });

  it('fails when the created account has no advisor profile', async () => {
    const useCase = new CreateAdvisorUseCase(
      buildDao(null) as any,
      buildAccountPort() as any,
    );

    await expect(
      useCase.execute({
        name: 'Laura',
        email: 'laura@c360.co',
        password: 'Password123!',
      }),
    ).rejects.toThrow(AdvisorNotFoundError);
  });
});
