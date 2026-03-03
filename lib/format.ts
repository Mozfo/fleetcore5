/**
 * Date formatting utilities — Single Source of Truth.
 *
 * All date display formatting MUST import from this file.
 * CSV/export formatting is a separate concern (ISO strings).
 *
 * @module lib/format
 */

/**
 * Format a date for display (date only).
 * Uses the browser's locale by default.
 *
 * @param date - Date value (Date, string, number, null, undefined)
 * @param opts - Intl.DateTimeFormat options override
 * @returns Formatted date string or "—" for invalid/null values
 *
 * @example
 * formatDate("2024-12-15") // → "December 15, 2024" (en-US)
 * formatDate("2024-12-15", { month: "short" }) // → "Dec 15, 2024"
 * formatDate(null) // → "—"
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return "—";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a date with time for display.
 *
 * @param date - Date value
 * @param opts - Intl.DateTimeFormat options override
 * @returns Formatted datetime string or "—"
 *
 * @example
 * formatDateTime("2024-12-15T14:30:00Z") // → "December 15, 2024, 2:30 PM"
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  return formatDate(date, {
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

/**
 * Format date as compact DD/MM/YYYY HH:MM.
 * Used in table expanded rows and compact displays.
 *
 * @param date - Date value
 * @returns "DD/MM/YYYY HH:MM" or "—"
 */
export function formatDateCompact(
  date: Date | string | number | null | undefined
): string {
  if (!date) return "—";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

/**
 * Format date for column cells (date only, browser locale).
 * Convenience wrapper matching the common column helper pattern.
 *
 * @param value - Any value (typically from row accessor)
 * @returns Formatted date or "—"
 */
export function formatDateCell(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
