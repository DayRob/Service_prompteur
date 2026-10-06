"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { sessionCookieName } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getAuthEnv } from "@/lib/env";
import { getClientIp } from "@/lib/request";

export async function logout(): Promise<void> {
  const requestHeaders = await headers();
  const store = await cookies();
  store.delete(sessionCookieName(getAuthEnv().COOKIE_SECURE));
  await audit(getDb(), {
    actor: "owner",
    action: "logout",
    ip: getClientIp(requestHeaders),
    userAgent: requestHeaders.get("user-agent"),
  });
  redirect("/login");
}
