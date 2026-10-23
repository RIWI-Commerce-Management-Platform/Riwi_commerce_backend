import { describe, expect, it } from 'vitest';
import { extractSetCookies } from './extract-set-cookies.js';

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
});
