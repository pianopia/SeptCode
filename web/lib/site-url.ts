const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
      return vercelUrl.startsWith("http") ? vercelUrl.replace(/\/+$/, "") : `https://${vercelUrl.replace(/\/+$/, "")}`;
    }
    return DEFAULT_SITE_URL;
  }
  return raw.replace(/\/+$/, "");
}
