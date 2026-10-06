import { z } from "zod";

/**
 * Variables d'environnement validées par domaine, évaluées à l'appel (jamais à l'import)
 * pour ne pas casser le build. Chaque domaine échoue séparément : la connexion ne dépend
 * pas de la clé Anthropic, par exemple.
 */

const authSchema = z.object({
  APP_PASSWORD: z.string().min(12, "APP_PASSWORD doit faire au moins 12 caractères"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET doit faire au moins 32 caractères"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

const dbSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
});

const aiSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY est requis"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  PROMPT_LANGUAGE: z.enum(["fr", "en"]).default("fr"),
});

function lazy<S extends z.ZodType>(schema: S): () => z.output<S> {
  let cached: z.output<S> | undefined;
  return () => {
    if (cached === undefined) {
      const parsed = schema.safeParse(process.env);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new Error(`Variables d'environnement invalides :\n${issues.join("\n")}`);
      }
      cached = parsed.data;
    }
    return cached;
  };
}

export const getAuthEnv = lazy(authSchema);
export const getDbEnv = lazy(dbSchema);
export const getAiEnv = lazy(aiSchema);

export const envSchemas = { authSchema, dbSchema, aiSchema };
