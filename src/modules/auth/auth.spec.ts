import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: unknown) => ({ options })),
  sendPasswordResetEmail: vi.fn(),
  isInactiveAdvisor: vi.fn(),
}));

vi.mock('better-auth', () => ({ betterAuth: mocks.betterAuth }));
vi.mock('pg', () => ({ Pool: vi.fn(function Pool() {}) }));
vi.mock('./infrastructure/password-reset-mailer.js', () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));
vi.mock('./infrastructure/inactive-advisor.guard.js', () => ({
  isInactiveAdvisor: mocks.isInactiveAdvisor,
}));

/** Loads auth.ts again so it reads the current environment. */
const loadOptions = async (): Promise<any> => {
  vi.resetModules();
  mocks.betterAuth.mockClear();
  await import('./auth.js');
  return mocks.betterAuth.mock.calls[0][0];
};

describe('Better Auth configuration', () => {
  const env = { ...process.env };

  beforeEach(() => {
    delete process.env.MICROSOFT_CLIENT_ID;
    delete process.env.MICROSOFT_CLIENT_SECRET;
    delete process.env.MICROSOFT_TENANT_ID;
  });

  afterEach(() => {
    process.env = { ...env };
    vi.clearAllMocks();
  });

  it('leaves Microsoft sign-in off when its credentials are missing', async () => {
    const options = await loadOptions();

    expect(options.socialProviders).toEqual({});
  });

  it('enables Microsoft sign-in for any tenant when only the credentials are set', async () => {
    process.env.MICROSOFT_CLIENT_ID = 'client';
    process.env.MICROSOFT_CLIENT_SECRET = 'secret';

    const options = await loadOptions();

    expect(options.socialProviders.microsoft).toEqual({
      clientId: 'client',
      clientSecret: 'secret',
      tenantId: 'common',
    });
  });

  it('uses the configured Microsoft tenant', async () => {
    process.env.MICROSOFT_CLIENT_ID = 'client';
    process.env.MICROSOFT_CLIENT_SECRET = 'secret';
    process.env.MICROSOFT_TENANT_ID = 'riwi';

    const options = await loadOptions();

    expect(options.socialProviders.microsoft.tenantId).toBe('riwi');
  });

  it('emails the reset link to the user', async () => {
    const options = await loadOptions();

    await options.emailAndPassword.sendResetPassword({
      user: { email: 'ana@riwi.com', name: 'Ana' },
      url: 'http://localhost/reset',
    });

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith({
      to: 'ana@riwi.com',
      name: 'Ana',
      url: 'http://localhost/reset',
    });
  });

  it('rejects a new session for an inactive advisor', async () => {
    const options = await loadOptions();
    mocks.isInactiveAdvisor.mockResolvedValue(true);

    await expect(
      options.databaseHooks.session.create.before({ userId: '5' }),
    ).rejects.toThrow('This advisor account is inactive');
  });

  it('lets an active user start a session', async () => {
    const options = await loadOptions();
    mocks.isInactiveAdvisor.mockResolvedValue(false);

    await expect(
      options.databaseHooks.session.create.before({ userId: '5' }),
    ).resolves.toBeUndefined();
  });
});
