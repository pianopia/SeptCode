import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@septcode/db/schema";
import { env } from "@/lib/env";

if (!env.tursoUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is empty. Set it in admin/.env.local or repository root .env, then restart dev server."
  );
}

const client = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken
});

export const db = drizzle(client, { schema });
