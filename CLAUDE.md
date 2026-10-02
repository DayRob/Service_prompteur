@AGENTS.md

# Idea Forge

Web app perso, mono-utilisateur, qui transforme une idée brute en prompt Claude Code complet :
capture, questions de clarification, génération en streaming, versions, affinage, export.
Interface et prompts générés en français.

## Stack

- Next.js (App Router, sans dossier `src/`), TypeScript strict, Tailwind CSS
- Postgres (Supabase) via Drizzle ORM et le driver `postgres`
- API Anthropic appelée côté serveur uniquement
- Zod pour toute validation d'entrée
- Vitest pour les tests
- Déploiement Vercel

## Commandes

- `npm run dev` : serveur de développement
- `npm run build` : build de production
- `npm run lint` : ESLint
- `npm run typecheck` : vérification TypeScript
- `npm test` : tests Vitest
- `npm run db:generate` : génère une migration depuis `lib/db/schema.ts`
- `npm run db:migrate` : applique les migrations (utilise `DATABASE_URL_DIRECT`)

## Architecture

- `app/` : routes, pages, route handlers et server actions
- `lib/env.ts` : validation Zod des variables d'environnement, évaluée à l'appel (jamais à l'import)
- `lib/db/` : client Drizzle (`index.ts`) et schéma (`schema.ts`)
- `lib/prompts/` : prompts système envoyés à l'API Anthropic, un fichier par rôle
  (titre, questions, génération, affinage, découpage d'import). Ce sont les fichiers à modifier pour ajuster le comportement de l'IA.
- `drizzle/` : migrations SQL générées, à committer

## Conventions

- Aucun secret dans le code ni dans git. Toute variable d'environnement figure dans `.env.example`.
- La clé Anthropic ne quitte jamais le serveur : pas de `NEXT_PUBLIC_` pour elle, pas d'appel API depuis le client.
- Toute entrée utilisateur est validée avec Zod avant usage.
- Les routes qui appellent l'API Anthropic passent par le rate limiting.
- Connexion base : pooler Supabase en mode transaction, donc `prepare: false`.
- Les tables ont la sécurité par ligne (RLS) activée sans politique : seul le serveur accède aux données.
- Mobile-first, mode sombre, accessibilité de base (labels, contrastes, focus visible).
- Un commit par phase du plan, messages en français ou anglais clairs et atomiques.

## Évolutions prévues (ne pas coder avant demande)

- Templates de prompt par type de projet
- Génération d'un `CLAUDE.md` en complément du prompt (`prompt_versions.kind` est extensible)
- Lien entre une idée et son repo GitHub
