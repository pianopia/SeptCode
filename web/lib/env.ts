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
  gcsBucketName: process.env.GCS_BUCKET_NAME ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development"
};

if (!env.tursoUrl) {
  console.warn("TURSO_DATABASE_URL is not set. Checked web and repository root .env files.");
}

if (env.nodeEnv === "production" && (!process.env.AUTH_SECRET || env.authSecret === "dev-secret-change-me")) {
  throw new Error("AUTH_SECRET must be set to a strong random value in production.");
}
