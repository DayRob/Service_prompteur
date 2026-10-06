/**
 * Adresse du client. Derrière Caddy, le premier élément de X-Forwarded-For est celui vu par le proxy
 * (Caddy écrase la valeur envoyée par un client non approuvé). Hors proxy, la valeur est falsifiable :
 * la limite globale de connexion couvre ce cas.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "inconnue";
}
