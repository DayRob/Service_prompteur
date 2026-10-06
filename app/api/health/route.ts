import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

/** Sonde de santé publique pour Docker et le proxy. Ne révèle aucun détail. */
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch (error) {
    log("error", "health.db_unreachable", { error });
    return Response.json({ status: "error" }, { status: 503 });
  }
}
