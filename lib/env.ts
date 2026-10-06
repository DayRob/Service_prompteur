import { z } from "zod";

const schema = z.object({
  APP_PASSWORD: z.string().min(12, "APP_PASSWORD doit faire au moins 12 caractères"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET doit faire au moins 32 caractères"),
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  PROMPT_LANGUAGE: z.enum(["fr", "en"]).default("fr"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Valide et retourne les variables d'environnement. Évalué à l'appel, jamais à l'import, pour ne pas casser le build. */
export function getEnv(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new Error(`Variables d'environnement invalides :\n${issues.join("\n")}`);
    }
    cached = parsed.data;
  }
  return cached;
}
