import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SessionCurrentAdvisorProvider } from './session-current-advisor.provider.js';

describe('SessionCurrentAdvisorProvider', () => {
  const provider = new SessionCurrentAdvisorProvider();

  it('extracts the advisor ID from the authenticated session', async () => {
    await expect(
      provider.extract({ user: { role: 'ASESOR', idAsesor: 42 } }),
    ).resolves.toBe(42);
  });

  it('allows administrators to access all advisor records', async () => {
    await expect(
      provider.extract({ user: { role: 'ADMINISTRADOR', idAsesor: null } }),
    ).resolves.toBeNull();
  });

  it('rejects requests without an advisor or administrator role', async () => {
    await expect(provider.extract({})).rejects.toThrow(ForbiddenException);
  });

  it('rejects advisor sessions without an associated advisor record', async () => {
    await expect(
      provider.extract({ user: { role: 'ASESOR', idAsesor: null } }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
