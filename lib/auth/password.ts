import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

/** Comparaison à temps constant : on compare des empreintes de longueur fixe. */
export function verifyPassword(input: string, expected: string): boolean {
  return timingSafeEqual(digest(input), digest(expected));
}
