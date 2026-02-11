import path from "node:path";
import { loadEnvConfig } from "@next/env";

if (typeof window === "undefined") {
  loadEnvConfig(process.cwd());
  if (!process.env.TURSO_DATABASE_URL) {
    loadEnvConfig(path.resolve(process.cwd(), ".."));
  }
}

export const env = {
  tursoUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  adminLoginId: process.env.ADMIN_LOGIN_ID ?? "",
  adminLoginPassword: process.env.ADMIN_LOGIN_PASSWORD ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development"
};

if (!env.tursoUrl) {
  console.warn("TURSO_DATABASE_URL is not set. Checked admin and repository root .env files.");
}

if (!env.adminLoginId || !env.adminLoginPassword) {
  console.warn("ADMIN_LOGIN_ID or ADMIN_LOGIN_PASSWORD is not set.");
}

if (env.nodeEnv === "production") {
  if (!process.env.AUTH_SECRET || env.authSecret === "dev-secret-change-me") {
    console.warn("AUTH_SECRET should be set to a strong random value in production.");
  }
  if (!env.adminLoginId || !env.adminLoginPassword) {
    console.warn("ADMIN_LOGIN_ID and ADMIN_LOGIN_PASSWORD should be set in production.");
  }
}
