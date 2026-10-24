export type CsvValue = string | number | boolean | Date | null | undefined;

export type CsvSeparator = ',' | ';';

/** UTF-8 byte order mark: makes Excel read accents and ñ correctly. */
export const UTF8_BOM = '﻿';

function formatValue(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function escapeCell(value: CsvValue, separator: CsvSeparator): string {
  const text = formatValue(value);
  // Cells starting with these could run as formulas in Excel (CSV injection).
  const safe =
    /^[=+\-@\t\r]/.test(text) && typeof value === 'string' ? `'${text}` : text;
  return /["\r\n]/.test(safe) || safe.includes(separator)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}

/**
 * RFC 4180 CSV with a UTF-8 BOM and CRLF line endings, so it opens
 * correctly in Excel (HU-38).
 */
export function toCsv(
  headers: string[],
  rows: CsvValue[][],
  separator: CsvSeparator = ',',
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCell(cell, separator)).join(separator),
  );
  return UTF8_BOM + lines.join('\r\n') + '\r\n';
}
