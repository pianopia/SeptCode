import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import * as schema from "@septima/db/schema";

if (!env.tursoUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is empty. Set it in web/.env.local or repository root .env, then restart dev server."
  );
}

const client = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken
});

export const db = drizzle(client, { schema });
