import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@septcode/db/schema";
import { env } from "./env";

if (!env.tursoUrl) {
  throw new Error("TURSO_DATABASE_URL is empty.");
}

const client = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken
});

export const db = drizzle(client, { schema });
