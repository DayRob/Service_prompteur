import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_MAX_AGE_SECONDS, sessionCookieName, signSession, verifySession } from "@/lib/auth/session";

const SECRET = "a".repeat(40);

describe("session", () => {
  it("accepte un jeton valide", async () => {
    expect(await verifySession(await signSession(SECRET), SECRET)).toBe(true);
  });

  it("refuse un jeton absent ou illisible", async () => {
    expect(await verifySession(undefined, SECRET)).toBe(false);
    expect(await verifySession("n-importe-quoi", SECRET)).toBe(false);
  });

  it("refuse un jeton signé avec un autre secret", async () => {
    expect(await verifySession(await signSession("b".repeat(40)), SECRET)).toBe(false);
  });

  it("refuse un jeton modifié", async () => {
    const token = await signSession(SECRET);
    const [header, payload, signature] = token.split(".");
    const forged = `${header}.${Buffer.from(JSON.stringify({ sub: "owner", exp: 9999999999 })).toString("base64url")}.${signature}`;
    expect(payload).toBeTruthy();
    expect(await verifySession(forged, SECRET)).toBe(false);
  });

  it("refuse un jeton expiré", async () => {
    const issued = new Date("2026-01-01T00:00:00Z");
    const token = await signSession(SECRET, issued);
    const later = new Date(issued.getTime() + (SESSION_MAX_AGE_SECONDS + 60) * 1000);
    expect(await verifySession(token, SECRET, later)).toBe(false);
    expect(await verifySession(token, SECRET, issued)).toBe(true);
  });

  it("refuse un jeton qui n'est pas destiné au propriétaire", async () => {
    const token = await new SignJWT({ sub: "autre" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySession(token, SECRET)).toBe(false);
  });

  it("refuse un jeton signé avec un autre algorithme", async () => {
    const token = await new SignJWT({ sub: "owner" })
      .setProtectedHeader({ alg: "HS512" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySession(token, SECRET)).toBe(false);
  });

  it("utilise le préfixe __Host- uniquement en mode sécurisé", () => {
    expect(sessionCookieName(true)).toBe("__Host-forge_session");
    expect(sessionCookieName(false)).toBe("forge_session");
  });
});

describe("verifyPassword", () => {
  it("accepte le bon mot de passe", () => {
    expect(verifyPassword("correct horse battery", "correct horse battery")).toBe(true);
  });
  it("refuse un mot de passe différent, quelle que soit sa longueur", () => {
    expect(verifyPassword("faux", "correct horse battery")).toBe(false);
    expect(verifyPassword("correct horse battery staple", "correct horse battery")).toBe(false);
    expect(verifyPassword("", "correct horse battery")).toBe(false);
  });
});
