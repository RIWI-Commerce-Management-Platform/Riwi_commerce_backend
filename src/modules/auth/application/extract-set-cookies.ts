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

/**
 * Parses the Better Auth response, extracting cookies and verifying success.
 */
export async function parseAuthResponse<T = unknown>(
  response: globalThis.Response,
  ErrorClass: new (message?: string) => Error,
): Promise<{ data: T; setCookieHeaders: SetCookieHeaders }> {
  const setCookieHeaders = extractSetCookies(response);

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<
      string,
      any
    >;
    throw new ErrorClass(
      errorData?.message ||
        (response as any).statusText ||
        errorData?.statusText,
    );
  }

  return { data: (await response.json()) as T, setCookieHeaders };
}
