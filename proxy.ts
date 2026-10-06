import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName, verifySession } from "@/lib/auth/session";
import { getAuthEnv } from "@/lib/env";

/**
 * Premier filtre : toute requête sans session valide est renvoyée vers /login (401 pour /api).
 * Les pages, actions et routes revérifient la session eux-mêmes (voir lib/auth/dal.ts).
 */
export async function proxy(request: NextRequest) {
  const env = getAuthEnv();
  const token = request.cookies.get(sessionCookieName(env.COOKIE_SECURE))?.value;
  if (await verifySession(token, env.SESSION_SECRET)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Publics : la page de connexion, la sonde de santé, le manifest et les icônes
  // (le manifest est demandé sans cookie par le navigateur), les assets Next.
  matcher: [
    "/((?!login$|api/health$|_next/static|_next/image|manifest\\.webmanifest$|icons/|favicon\\.ico$).*)",
  ],
};
