export function parseDbTimestamp(value: string): Date {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date(NaN);

  // SQLite CURRENT_TIMESTAMP format is "YYYY-MM-DD HH:MM:SS" in UTC.
  // Add "T" and trailing "Z" so JS always parses it as UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return new Date(raw.replace(" ", "T") + "Z");
  }

  // If timezone is already included, Date can parse it directly.
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(raw)) {
    return new Date(raw);
  }

  // ISO-like timestamps without timezone are treated as UTC for consistency.
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return new Date(raw + "Z");
  }

  return new Date(raw);
}
