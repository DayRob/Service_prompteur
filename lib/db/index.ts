import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";

type Db = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as { __db?: Db };

/** Client Drizzle unique par processus. */
export function getDb(): Db {
  if (!globalForDb.__db) {
    const client = postgres(getEnv().DATABASE_URL, { max: 5 });
    globalForDb.__db = drizzle(client);
  }
  return globalForDb.__db;
}
