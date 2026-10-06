import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDbEnv } from "@/lib/env";

export type Db = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as { __db?: Db };

/** Client Drizzle unique par processus. */
export function getDb(): Db {
  if (!globalForDb.__db) {
    const client = postgres(getDbEnv().DATABASE_URL, { max: 5 });
    globalForDb.__db = drizzle(client);
  }
  return globalForDb.__db;
}
