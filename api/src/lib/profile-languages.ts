const MAX_PROFILE_LANGUAGES = 8;
const MAX_PROFILE_LANGUAGE_LENGTH = 24;

export function parseProfileLanguages(raw: string | null | undefined) {
  const input = String(raw ?? "");
  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of input.split(",")) {
    const normalized = token.trim();
    if (!normalized) continue;
    if (normalized.length > MAX_PROFILE_LANGUAGE_LENGTH) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= MAX_PROFILE_LANGUAGES) break;
  }

  return result;
}

export function serializeProfileLanguages(raw: string | null | undefined) {
  return parseProfileLanguages(raw).join(", ");
}
