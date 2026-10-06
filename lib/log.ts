/**
 * Journal structuré : une ligne JSON par événement sur stdout, collectée par Docker.
 * Les valeurs dont la clé évoque un secret sont masquées avant écriture.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY = /pass|secret|token|key|authorization|cookie|credential/i;
const MAX_DEPTH = 6;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[trop profond]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SENSITIVE_KEY.test(k) ? "[masqué]" : redact(v, depth + 1),
      ]),
    );
  }
  return value;
}

export function log(level: LogLevel, event: string, data: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(redact(data) as Record<string, unknown>),
  });
  (level === "error" || level === "warn" ? console.error : console.log)(line);
}
