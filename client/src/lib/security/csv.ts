/**
 * Sanitizes a CSV cell to defend against CSV / Formula Injection (CWE-1236).
 * Spreadsheet software (Excel, LibreOffice, Google Sheets) executes cells starting with
 * '=', '+', '-', '@', '\t', or '\r' as formulas or DDE commands.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // If the cell begins with dangerous trigger characters (either raw or after whitespace), neutralize it
  const formulaTriggers = ["=", "+", "-", "@", "\t", "\r"];
  const trimmed = str.trimStart();
  if (formulaTriggers.some((trigger) => str.startsWith(trigger) || trimmed.startsWith(trigger))) {
    str = `'${str}`;
  }

  // Escape internal double quotes by doubling them per RFC 4180
  const escaped = str.replace(/"/g, '""');

  // Wrap in quotes if it contains commas, newlines, or quotes
  if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
    return `"${escaped}"`;
  }

  return escaped;
}

export function generateSafeCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}
