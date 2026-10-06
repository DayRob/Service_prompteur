import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { audit } from "@/lib/audit";
import { auditLog, ideas } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";

// Tests d'intégration : exécutés seulement si TEST_DATABASE_URL pointe vers une base migrée.
const url = process.env.TEST_DATABASE_URL;
const client = url ? postgres(url, { max: 2 }) : undefined;
const db = client ? drizzle(client) : undefined;

afterAll(async () => {
  await client?.end();
});

describe.skipIf(!db)("rateLimit (Postgres)", () => {
  it("autorise jusqu'à la limite puis bloque", async () => {
    const key = `test:${randomUUID()}`;
    const now = new Date("2026-03-01T10:00:30Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit(db!, key, 3, 60, now));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.count)).toEqual([1, 2, 3, 4]);
    expect(results[3].retryAfterSeconds).toBe(30);
  });

  it("repart de zéro dans une nouvelle fenêtre", async () => {
    const key = `test:${randomUUID()}`;
    await rateLimit(db!, key, 1, 60, new Date("2026-03-01T10:00:10Z"));
    const blocked = await rateLimit(db!, key, 1, 60, new Date("2026-03-01T10:00:20Z"));
    const next = await rateLimit(db!, key, 1, 60, new Date("2026-03-01T10:01:05Z"));
    expect(blocked.allowed).toBe(false);
    expect(next.allowed).toBe(true);
  });

  it("isole les clés entre elles", async () => {
    const now = new Date("2026-03-01T10:00:00Z");
    const a = await rateLimit(db!, `test:${randomUUID()}`, 1, 60, now);
    const b = await rateLimit(db!, `test:${randomUUID()}`, 1, 60, now);
    expect(a.allowed && b.allowed).toBe(true);
  });

  it("compte correctement sous des appels concurrents", async () => {
    const key = `test:${randomUUID()}`;
    const now = new Date("2026-03-01T10:00:00Z");
    const results = await Promise.all(Array.from({ length: 10 }, () => rateLimit(db!, key, 4, 60, now)));
    expect(results.filter((r) => r.allowed)).toHaveLength(4);
    expect(Math.max(...results.map((r) => r.count))).toBe(10);
  });
});

describe.skipIf(!db)("audit (Postgres)", () => {
  it("enregistre l'événement en masquant les secrets", async () => {
    const action = `test_${randomUUID()}`;
    await audit(db!, { actor: "owner", action, ip: "1.2.3.4", details: { password: "x", step: "s" } });
    const [row] = await db!.select().from(auditLog).where(eq(auditLog.action, action));
    expect(row.details).toEqual({ password: "[masqué]", step: "s" });
    expect(row.actor).toBe("owner");
  });
});

describe.skipIf(!db)("schéma ideas (Postgres)", () => {
  it("la recherche plein texte française trouve une idée par la racine d'un mot", async () => {
    const marker = `zz${randomUUID().replaceAll("-", "")}`;
    const [created] = await db!
      .insert(ideas)
      .values({ rawText: `Application de suivi des dépenses ${marker}`, tags: ["finance"] })
      .returning({ id: ideas.id });
    try {
      const hit = await db!
        .select({ id: ideas.id })
        .from(ideas)
        .where(sql`${ideas.search} @@ websearch_to_tsquery('french', ${`dépense ${marker}`})`);
      const miss = await db!
        .select({ id: ideas.id })
        .from(ideas)
        .where(sql`${ideas.search} @@ websearch_to_tsquery('french', ${`inexistant ${marker}`})`);
      expect(hit.map((r) => r.id)).toEqual([created.id]);
      expect(miss).toHaveLength(0);
    } finally {
      await db!.delete(ideas).where(eq(ideas.id, created.id));
    }
  });
});
