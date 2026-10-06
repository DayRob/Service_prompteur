import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthEnv } from "@/lib/env";
import { sessionCookieName, verifySession } from "@/lib/auth/session";

/** Vérifie le cookie de session. Mis en cache pour la durée d'une requête. */
export const hasSession = cache(async (): Promise<boolean> => {
  // cookies() en premier : il rend la page dynamique, donc aucun secret n'est lu pendant le build.
  const store = await cookies();
  const env = getAuthEnv();
  return verifySession(store.get(sessionCookieName(env.COOKIE_SECURE))?.value, env.SESSION_SECRET);
});

/** À appeler dans les layouts, pages et actions protégés : le proxy ne suffit pas à lui seul. */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) redirect("/login");
}
