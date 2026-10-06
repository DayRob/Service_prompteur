import type { Db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { log, redact } from "@/lib/log";

export type AuditEntry = {
  actor: string;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
};

/** Écrit dans audit_log et dans les logs. Une panne d'écriture est journalisée mais ne bloque pas l'action. */
export async function audit(db: Db, entry: AuditEntry): Promise<void> {
  const details = redact(entry.details ?? {}) as Record<string, unknown>;
  log("info", `audit.${entry.action}`, { actor: entry.actor, ip: entry.ip, ...details });
  try {
    await db.insert(auditLog).values({
      actor: entry.actor,
      action: entry.action,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent?.slice(0, 300) ?? null,
      details,
    });
  } catch (error) {
    log("error", "audit.write_failed", { action: entry.action, error });
  }
}
