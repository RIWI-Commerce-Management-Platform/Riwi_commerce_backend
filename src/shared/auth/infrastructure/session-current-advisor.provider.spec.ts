import { describe, expect, it } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { SessionCurrentAdvisorProvider } from './session-current-advisor.provider.js';

describe('SessionCurrentAdvisorProvider', () => {
  const provider = new SessionCurrentAdvisorProvider();

  it('returns the id of the session user', async () => {
    await expect(provider.extract({ user: { id: 42 } })).resolves.toBe(42);
  });

  it.each([
    ['no user', {}],
    ['no id', { user: {} }],
    ['a string id', { user: { id: '42' } }],
    ['a zero id', { user: { id: 0 } }],
    ['a fractional id', { user: { id: 1.5 } }],
  ])('rejects a request with %s', async (_label, request) => {
    await expect(provider.extract(request)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
