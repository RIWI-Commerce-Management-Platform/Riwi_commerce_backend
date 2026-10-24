import { describe, expect, it } from 'vitest';
import { toNumericAuthIds } from './to-numeric-auth-ids.js';

describe('toNumericAuthIds', () => {
  it('converts the ids of a login/register response', () => {
    const result = toNumericAuthIds({
      token: 'abc',
      user: { id: '12', email: 'a@b.co' },
    });

    expect(result).toEqual({ token: 'abc', user: { id: 12, email: 'a@b.co' } });
  });

  it('converts a session record and its user reference', () => {
    expect(toNumericAuthIds({ id: '4', userId: '12', token: 't' })).toEqual({
      id: 4,
      userId: 12,
      token: 't',
    });
  });

  it('converts nested session and user records', () => {
    expect(
      toNumericAuthIds({
        session: { id: '4', userId: '12' },
        user: { id: '12' },
      }),
    ).toEqual({ session: { id: 4, userId: 12 }, user: { id: 12 } });
  });

  it('leaves non-numeric ids and non-object values untouched', () => {
    expect(toNumericAuthIds({ id: 'abc' })).toEqual({ id: 'abc' });
    expect(toNumericAuthIds(null)).toBeNull();
    expect(toNumericAuthIds('text')).toBe('text');
    expect(toNumericAuthIds({ user: null })).toEqual({ user: null });
  });

  it('does not mutate the input', () => {
    const input = { user: { id: '1' } };
    toNumericAuthIds(input);
    expect(input.user.id).toBe('1');
  });
});
