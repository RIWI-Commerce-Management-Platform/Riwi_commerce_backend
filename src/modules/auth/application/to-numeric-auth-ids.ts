/**
 * Better Auth stores serial integer ids but always returns them as strings
 * ("5"). This converts the id fields of its user/session payloads back to
 * numbers, so the rest of the API only ever sees numeric ids.
 */
const ID_FIELDS = ['id', 'userId'] as const;

function toNumber(value: unknown): unknown {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return value;
  }
  return Number(value);
}

function normalizeRecord<T>(record: T): T {
  if (!record || typeof record !== 'object') {
    return record;
  }
  const copy: Record<string, unknown> = {
    ...(record as Record<string, unknown>),
  };
  for (const field of ID_FIELDS) {
    if (field in copy) {
      copy[field] = toNumber(copy[field]);
    }
  }
  return copy as T;
}

/**
 * Normalizes a Better Auth response or session: the object itself (a user or
 * a session) and its nested `user` and `session` records.
 */
export function toNumericAuthIds<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const result = normalizeRecord(payload) as Record<string, unknown>;
  for (const key of ['user', 'session']) {
    if (key in result) {
      result[key] = normalizeRecord(result[key]);
    }
  }
  return result as T;
}
