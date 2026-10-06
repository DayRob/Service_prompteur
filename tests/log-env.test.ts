import { describe, expect, it, vi } from "vitest";
import { envSchemas } from "@/lib/env";
import { log, redact } from "@/lib/log";
import { getClientIp } from "@/lib/request";

describe("redact", () => {
  it("masque les clés sensibles, y compris en profondeur", () => {
    const out = redact({
      user: "robin",
      password: "x",
      nested: { apiKey: "sk-123", Authorization: "Bearer y", list: [{ token: "t", ok: 1 }] },
    });
    expect(out).toEqual({
      user: "robin",
      password: "[masqué]",
      nested: { apiKey: "[masqué]", Authorization: "[masqué]", list: [{ token: "[masqué]", ok: 1 }] },
    });
  });

  it("réduit une erreur à son nom et son message", () => {
    expect(redact({ error: new Error("boum") })).toEqual({ error: { name: "Error", message: "boum" } });
  });
});

describe("log", () => {
  it("écrit une ligne JSON sans secret", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log("info", "test.event", { step: "a", password: "secret" });
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line).toMatchObject({ level: "info", event: "test.event", step: "a", password: "[masqué]" });
    expect(typeof line.ts).toBe("string");
    spy.mockRestore();
  });
});

describe("envSchemas", () => {
  it("exige un mot de passe de 12 caractères et un secret de 32", () => {
    const base = { APP_PASSWORD: "x".repeat(12), SESSION_SECRET: "y".repeat(32) };
    expect(envSchemas.authSchema.safeParse(base).success).toBe(true);
    expect(envSchemas.authSchema.safeParse({ ...base, APP_PASSWORD: "court" }).success).toBe(false);
    expect(envSchemas.authSchema.safeParse({ ...base, SESSION_SECRET: "court" }).success).toBe(false);
  });

  it("COOKIE_SECURE vaut true par défaut et se convertit en booléen", () => {
    const base = { APP_PASSWORD: "x".repeat(12), SESSION_SECRET: "y".repeat(32) };
    expect(envSchemas.authSchema.parse(base).COOKIE_SECURE).toBe(true);
    expect(envSchemas.authSchema.parse({ ...base, COOKIE_SECURE: "false" }).COOKIE_SECURE).toBe(false);
    expect(envSchemas.authSchema.safeParse({ ...base, COOKIE_SECURE: "peut-etre" }).success).toBe(false);
  });

  it("le modèle Anthropic a une valeur par défaut", () => {
    expect(envSchemas.aiSchema.parse({ ANTHROPIC_API_KEY: "k" }).ANTHROPIC_MODEL).toBe("claude-sonnet-5-5");
  });
});

describe("getClientIp", () => {
  it("prend le premier élément de X-Forwarded-For", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });
  it("retombe sur X-Real-IP puis sur une valeur par défaut", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(new Headers())).toBe("inconnue");
  });
});
