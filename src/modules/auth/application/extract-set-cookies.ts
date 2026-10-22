export type SetCookieHeaders = string[] | string | null;

/**
 * Better Auth's `asResponse: true` returns a Fetch API Response; this reads
 * its Set-Cookie header(s) in a form Express's res.setHeader() accepts.
 */
export function extractSetCookies(
  response: globalThis.Response,
): SetCookieHeaders {
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie');

  if (!cookies || (Array.isArray(cookies) && cookies.length === 0)) {
    return null;
  }

  return cookies;
}
