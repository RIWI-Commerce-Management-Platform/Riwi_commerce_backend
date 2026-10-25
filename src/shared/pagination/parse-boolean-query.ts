/**
 * Query strings arrive as text; `@Type(() => Boolean)` would turn "false"
 * into true. Use with `@Transform(({ value }) => parseBooleanQuery(value))`.
 */
export function parseBooleanQuery(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
