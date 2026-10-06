"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { SESSION_MAX_AGE_SECONDS, sessionCookieName, signSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { getAuthEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export type LoginState = { error?: string };

const loginSchema = z.object({ password: z.string().min(1).max(200) });

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS_PER_IP = 5;
const MAX_ATTEMPTS_GLOBAL = 20;

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: "Saisis le mot de passe." };

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const userAgent = requestHeaders.get("user-agent");
  const env = getAuthEnv();

  let success = false;
  try {
    const db = getDb();
    const perIp = await rateLimit(db, `login:ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_SECONDS);
    if (!perIp.allowed) {
      await audit(db, { actor: "anonyme", action: "login_blocked", ip, userAgent, details: { scope: "ip" } });
      return { error: `Trop de tentatives. Réessaie dans ${Math.ceil(perIp.retryAfterSeconds / 60)} min.` };
    }
    const global = await rateLimit(db, "login:global", MAX_ATTEMPTS_GLOBAL, WINDOW_SECONDS);
    if (!global.allowed) {
      await audit(db, { actor: "anonyme", action: "login_blocked", ip, userAgent, details: { scope: "global" } });
      return { error: `Trop de tentatives. Réessaie dans ${Math.ceil(global.retryAfterSeconds / 60)} min.` };
    }

    if (!verifyPassword(parsed.data.password, env.APP_PASSWORD)) {
      await audit(db, { actor: "anonyme", action: "login_failed", ip, userAgent });
      return { error: "Mot de passe incorrect." };
    }

    const token = await signSession(env.SESSION_SECRET);
    const store = await cookies();
    store.set(sessionCookieName(env.COOKIE_SECURE), token, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    await audit(db, { actor: "owner", action: "login_success", ip, userAgent });
    success = true;
  } catch (error) {
    log("error", "login.unavailable", { error });
    return { error: "Service indisponible. Réessaie dans un instant." };
  }

  if (success) redirect("/");
  return {};
}
