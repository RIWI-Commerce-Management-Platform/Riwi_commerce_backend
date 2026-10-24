import { BadRequestException } from '@nestjs/common';

export type AgendaPeriod = 'day' | 'week';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parses an optional 'YYYY-MM-DD' reference date; defaults to today. */
export function parseAgendaDate(date?: string): Date {
  if (!date) {
    return new Date();
  }

  if (!DATE_PATTERN.test(date)) {
    throw new BadRequestException(
      "Agenda date must use the 'YYYY-MM-DD' format.",
    );
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  const isCalendarValid =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isCalendarValid) {
    throw new BadRequestException('Agenda date is not a valid calendar date.');
  }

  return parsed;
}

/** The whole day, or Monday to Sunday of the week, around `reference`. */
export function resolveAgendaRange(
  period: AgendaPeriod,
  reference: Date,
): { startDate: Date; endDate: Date } {
  if (period === 'day') {
    const startDate = new Date(reference);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reference);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  const daysSinceMonday = (reference.getDay() + 6) % 7;

  const startDate = new Date(reference);
  startDate.setDate(reference.getDate() - daysSinceMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  return { startDate, endDate };
}
