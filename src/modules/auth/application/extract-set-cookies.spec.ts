import { describe, expect, it } from 'vitest';
import { extractSetCookies, parseAuthResponse } from './extract-set-cookies.js';

describe('extractSetCookies', () => {
  it('should use getSetCookie when available', () => {
    const mockResponse = {
      headers: {
        getSetCookie: () => ['cookie1=val1', 'cookie2=val2'],
        get: () => null,
      },
    } as unknown as Response;

    expect(extractSetCookies(mockResponse)).toEqual([
      'cookie1=val1',
      'cookie2=val2',
    ]);
  });

  it('should return null when getSetCookie returns an empty array', () => {
    const mockResponse = {
      headers: {
        getSetCookie: () => [],
        get: () => null,
      },
    } as unknown as Response;

    expect(extractSetCookies(mockResponse)).toBeNull();
  });

  it('should fall back to headers.get when getSetCookie is not a function', () => {
    const mockResponse = {
      headers: {
        get: (header: string) =>
          header === 'set-cookie' ? 'session=xyz; Path=/' : null,
      },
    } as unknown as Response;

    expect(extractSetCookies(mockResponse)).toBe('session=xyz; Path=/');
  });

  it('should return null when no set-cookie header is present', () => {
    const mockResponse = {
      headers: {
        get: () => null,
      },
    } as unknown as Response;

    expect(extractSetCookies(mockResponse)).toBeNull();
  });

  describe('parseAuthResponse', () => {
    it('returns data and cookies when response is ok', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          getSetCookie: () => ['cookie=val'],
        },
        json: async () => ({ token: 'abc' }),
      } as unknown as Response;

      const result = await parseAuthResponse(mockResponse, Error);
      expect(result).toEqual({
        data: { token: 'abc' },
        setCookieHeaders: ['cookie=val'],
      });
    });

    it('throws ErrorClass when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Unauthorized',
        headers: {
          getSetCookie: () => null,
          get: () => null,
        },
        json: async () => {
          throw new Error('fail parse');
        },
      } as unknown as Response;

      await expect(
        parseAuthResponse(mockResponse, class CustomError extends Error {}),
      ).rejects.toThrow('Unauthorized');
    });
  });
});
