import "server-only";

/** Escape a single CSV cell per RFC 4180 (quote when needed, double quotes). */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a full CSV document (header + rows) with a leading UTF-8 BOM so
 * Excel opens accented characters correctly. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

/** Today's date as YYYY-MM-DD for export filenames. */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
