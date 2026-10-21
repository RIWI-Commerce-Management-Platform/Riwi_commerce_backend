import { describe, expect, it } from 'vitest';

import { UnauthorizedException } from '@nestjs/common';

import { HeaderCurrentAdvisorProvider } from './header-current-advisor.provider.js';

describe('HeaderCurrentAdvisorProvider (TEMPORARY adapter)', () => {
  const provider = new HeaderCurrentAdvisorProvider();

  it('extracts the advisor id from the x-user-id header', async () => {
    const advisorId = await provider.extract({
      headers: { 'x-user-id': '42' },
    });

    expect(advisorId).toBe(42);
  });

  it('rejects a missing header', async () => {
    await expect(provider.extract({ headers: {} })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a non numeric header', async () => {
    await expect(
      provider.extract({ headers: { 'x-user-id': 'abc' } }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a zero or negative advisor id', async () => {
    await expect(
      provider.extract({ headers: { 'x-user-id': '0' } }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a header sent multiple times', async () => {
    await expect(
      provider.extract({ headers: { 'x-user-id': ['1', '2'] } }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
