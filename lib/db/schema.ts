import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const ideaStatus = pgEnum("idea_status", [
  "draft",
  "clarifying",
  "prompt_ready",
  "in_dev",
  "abandoned",
]);

export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull().default(""),
    /** true quand le titre a été modifié à la main : l'IA ne le régénère plus. */
    titleManual: boolean("title_manual").notNull().default(false),
    rawText: text("raw_text").notNull(),
    notes: text("notes").notNull().default(""),
    status: ideaStatus("status").notNull().default("draft"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Version marquée comme finale. Une seule par idée. */
    finalVersionId: uuid("final_version_id").references(
      (): AnyPgColumn => promptVersions.id,
      { onDelete: "set null" },
    ),
    /** Recherche plein texte française sur titre, texte brut et notes. */
    search: tsvector("search").generatedAlwaysAs(
      sql`to_tsvector('french'::regconfig, coalesce(title, '') || ' ' || coalesce(raw_text, '') || ' ' || coalesce(notes, ''))`,
    ),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("ideas_search_idx").using("gin", t.search),
    index("ideas_tags_idx").using("gin", t.tags),
    index("ideas_status_idx").on(t.status),
    index("ideas_created_at_idx").on(t.createdAt),
  ],
);

export const clarificationRounds = pgTable(
  "clarification_rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [unique("clarification_rounds_idea_round_uq").on(t.ideaId, t.roundNumber)],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => clarificationRounds.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    suggestions: jsonb("suggestions").$type<string[]>().notNull().default([]),
    answer: text("answer"),
    /** true : l'utilisateur laisse l'IA choisir, le choix sera signalé comme hypothèse. */
    skipped: boolean("skipped").notNull().default(false),
  },
  (t) => [
    unique("questions_round_position_uq").on(t.roundId, t.position),
    index("questions_round_idx").on(t.roundId),
  ],
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    /** Extensible : 'claude_md' pourra s'ajouter plus tard. */
    kind: text("kind").$type<"generation" | "refinement">().notNull().default("generation"),
    content: text("content").notNull(),
    /** Demande d'affinage à l'origine de cette version. */
    instruction: text("instruction"),
    parentVersionId: uuid("parent_version_id").references(
      (): AnyPgColumn => promptVersions.id,
      { onDelete: "set null" },
    ),
    model: text("model").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("prompt_versions_idea_version_uq").on(t.ideaId, t.versionNumber),
    index("prompt_versions_idea_idx").on(t.ideaId),
  ],
);

/** Compteurs en fenêtre fixe. Dans Postgres car l'app peut tourner en plusieurs processus. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamptz("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

/** Journal d'audit : connexions, actions sensibles. Ne jamais y mettre de secret. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ts: timestamptz("ts").notNull().defaultNow(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [index("audit_log_ts_idx").on(t.ts), index("audit_log_action_idx").on(t.action)],
);
