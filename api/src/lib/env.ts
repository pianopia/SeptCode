const rawPort = process.env.PORT ?? process.env.API_PORT ?? "8787";
const parsedPort = Number(rawPort);

export const env = {
  tursoUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  port: Number.isFinite(parsedPort) ? parsedPort : 8787,
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  nodeEnv: process.env.NODE_ENV ?? "development"
};

if (!env.tursoUrl) {
  console.warn("TURSO_DATABASE_URL is not set.");
}

if (env.nodeEnv === "production" && (!process.env.AUTH_SECRET || env.authSecret === "dev-secret-change-me")) {
  throw new Error("AUTH_SECRET must be set to a strong random value in production.");
}
