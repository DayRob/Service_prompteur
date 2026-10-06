import { randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Le préfixe __Host- impose Secure, Path=/ et l'absence de Domain : il n'est utilisable qu'en HTTPS. */
export function sessionCookieName(secure: boolean): string {
  return secure ? "__Host-forge_session" : "forge_session";
}

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signSession(secret: string, now: Date = new Date()): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomUUID())
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_MAX_AGE_SECONDS)
    .sign(key(secret));
}

/** Retourne true si le jeton est signé par ce secret, non expiré et destiné au propriétaire. */
export async function verifySession(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      currentDate: now,
    });
    return payload.sub === "owner";
  } catch {
    return false;
  }
}
