const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Start of the given 'YYYY-MM-DD' day in server time, or undefined. */
export function startOfDay(date?: string): Date | undefined {
  if (!date || !DATE_PATTERN.test(date)) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** End of the given 'YYYY-MM-DD' day in server time, or undefined. */
export function endOfDay(date?: string): Date | undefined {
  if (!date || !DATE_PATTERN.test(date)) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
