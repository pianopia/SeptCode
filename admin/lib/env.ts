import path from "node:path";
import { loadEnvConfig } from "@next/env";

if (typeof window === "undefined") {
  loadEnvConfig(process.cwd());
  // Also load repository-root .env as fallback for variables not defined in admin/.env
  loadEnvConfig(path.resolve(process.cwd(), ".."));
}

export const env = {
  tursoUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  adminLoginId: process.env.ADMIN_LOGIN_ID ?? "",
  adminLoginPassword: process.env.ADMIN_LOGIN_PASSWORD ?? "",
  officialPostName: process.env.OFFICIAL_POST_NAME ?? "SEPTCODE公式",
  officialPostHandle: process.env.OFFICIAL_POST_HANDLE ?? "septcode_official",
  officialPostEmail: process.env.OFFICIAL_POST_EMAIL ?? "official@septcode.local",
  officialPostCronSecret: process.env.OFFICIAL_POST_CRON_SECRET ?? "",
  officialPostIntervalMinutes: parsePositiveInt(process.env.OFFICIAL_POST_INTERVAL_MINUTES, 180),
  webAppUrl: resolveWebAppUrl(),
  nodeEnv: process.env.NODE_ENV ?? "development"
};

if (!env.tursoUrl) {
  console.warn("TURSO_DATABASE_URL is not set. Checked admin and repository root .env files.");
}

if (!env.adminLoginId || !env.adminLoginPassword) {
  console.warn("ADMIN_LOGIN_ID or ADMIN_LOGIN_PASSWORD is not set.");
}

if (!env.officialPostCronSecret) {
  console.warn("OFFICIAL_POST_CRON_SECRET is not set. Automated cron posting endpoint will be disabled.");
}

if (env.nodeEnv === "production") {
  if (!process.env.AUTH_SECRET || env.authSecret === "dev-secret-change-me") {
    console.warn("AUTH_SECRET should be set to a strong random value in production.");
  }
  if (!env.adminLoginId || !env.adminLoginPassword) {
    console.warn("ADMIN_LOGIN_ID and ADMIN_LOGIN_PASSWORD should be set in production.");
  }
  if (!env.officialPostCronSecret) {
    console.warn("OFFICIAL_POST_CRON_SECRET should be set in production.");
  }
}

function parsePositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number(raw ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
}

function normalizeBaseUrl(raw: string) {
  return raw.trim().replace(/\/+$/, "");
}

function resolveWebAppUrl() {
  const candidates = [process.env.WEB_APP_URL, process.env.NEXT_PUBLIC_SITE_URL];
  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(String(candidate ?? ""));
    if (normalized) return normalized;
  }
  return "http://localhost:3000";
}
