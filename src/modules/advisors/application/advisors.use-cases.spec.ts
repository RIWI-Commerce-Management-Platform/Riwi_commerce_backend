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

const buildRepository = (advisor: Advisor | null = buildAdvisor()) => ({
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
    const repository = buildRepository(buildAdvisor({ zoneId: null }));
    const accountPort = buildAccountPort();
    const useCase = new CreateAdvisorUseCase(
      repository as any,
      accountPort as any,
    );

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
    expect(repository.save).toHaveBeenCalled();
  });

  it('rejects an email that is already registered', async () => {
    const repository = buildRepository();
    repository.isEmailTaken.mockResolvedValue(true);
    const accountPort = buildAccountPort();
    const useCase = new CreateAdvisorUseCase(
      repository as any,
      accountPort as any,
    );

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
    const repository = buildRepository();
    repository.zoneExists.mockResolvedValue(false);
    const useCase = new CreateAdvisorUseCase(
      repository as any,
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
    const repository = buildRepository();
    const useCase = new ListAdvisorsUseCase(repository as any);

    await useCase.execute(
      { page: 1, limit: 10, zoneId: 9 },
      { id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 3 },
    );

    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      zoneId: 3,
    });
  });

  it('keeps the filters of an admin', async () => {
    const repository = buildRepository();
    const useCase = new ListAdvisorsUseCase(repository as any);

    await useCase.execute(
      { page: 1, limit: 10, zoneId: 9 },
      { id: 1, role: UserRole.ADMIN, zoneId: null },
    );

    expect(repository.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      zoneId: 9,
    });
  });
});

describe('GetAdvisorUseCase', () => {
  it('returns the advisor', async () => {
    const useCase = new GetAdvisorUseCase(buildRepository() as any);
    await expect(useCase.execute(5)).resolves.toMatchObject({ userId: 5 });
  });

  it('hides an advisor of another zone from a director', async () => {
    const useCase = new GetAdvisorUseCase(buildRepository() as any);
    await expect(
      useCase.execute(5, {
        id: 2,
        role: UserRole.DIRECTOR_REGIONAL,
        zoneId: 7,
      }),
    ).rejects.toThrow(AdvisorNotFoundError);
  });

  it('fails when the advisor does not exist', async () => {
    const useCase = new GetAdvisorUseCase(buildRepository(null) as any);
    await expect(useCase.execute(5)).rejects.toThrow(AdvisorNotFoundError);
  });
});

describe('UpdateAdvisorUseCase', () => {
  it('updates the profile and normalizes the email', async () => {
    const repository = buildRepository();
    const useCase = new UpdateAdvisorUseCase(repository as any);

    const advisor = await useCase.execute({
      userId: 5,
      email: 'NEW@c360.co',
      weeklyVisitGoal: 12,
    });

    expect(repository.isEmailTaken).toHaveBeenCalledWith('new@c360.co', 5);
    expect(advisor).toMatchObject({
      email: 'new@c360.co',
      weeklyVisitGoal: 12,
    });
  });

  it('rejects an email used by another user', async () => {
    const repository = buildRepository();
    repository.isEmailTaken.mockResolvedValue(true);
    const useCase = new UpdateAdvisorUseCase(repository as any);

    await expect(
      useCase.execute({ userId: 5, email: 'taken@c360.co' }),
    ).rejects.toThrow(AdvisorEmailAlreadyExistsError);
  });

  it('rejects an unknown zone', async () => {
    const repository = buildRepository();
    repository.zoneExists.mockResolvedValue(false);
    const useCase = new UpdateAdvisorUseCase(repository as any);

    await expect(useCase.execute({ userId: 5, zoneId: 77 })).rejects.toThrow(
      AdvisorZoneNotFoundError,
    );
  });

  it('fails when the advisor does not exist', async () => {
    const useCase = new UpdateAdvisorUseCase(buildRepository(null) as any);
    await expect(useCase.execute({ userId: 5 })).rejects.toThrow(
      AdvisorNotFoundError,
    );
  });
});

describe('ChangeAdvisorStatusUseCase', () => {
  it('deactivates the advisor and signs them out', async () => {
    const accountPort = buildAccountPort();
    const useCase = new ChangeAdvisorStatusUseCase(
      buildRepository() as any,
      accountPort as any,
    );

    const advisor = await useCase.execute({ userId: 5, isActive: false });

    expect(advisor.isActive).toBe(false);
    expect(accountPort.revokeSessions).toHaveBeenCalledWith(5);
  });

  it('reactivates the advisor without touching sessions', async () => {
    const accountPort = buildAccountPort();
    const useCase = new ChangeAdvisorStatusUseCase(
      buildRepository(buildAdvisor({ isActive: false })) as any,
      accountPort as any,
    );

    const advisor = await useCase.execute({ userId: 5, isActive: true });

    expect(advisor.isActive).toBe(true);
    expect(accountPort.revokeSessions).not.toHaveBeenCalled();
  });

  it('fails when the advisor does not exist', async () => {
    const useCase = new ChangeAdvisorStatusUseCase(
      buildRepository(null) as any,
      buildAccountPort() as any,
    );
    await expect(
      useCase.execute({ userId: 5, isActive: false }),
    ).rejects.toThrow(AdvisorNotFoundError);
  });
});
