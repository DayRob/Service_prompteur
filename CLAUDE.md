@AGENTS.md

# Idea Forge

Web app perso, mono-utilisateur, qui transforme une idée brute en prompt Claude Code complet :
capture, questions de clarification, génération en streaming, versions, affinage, export.
Interface et prompts générés en français.

## Stack

- Next.js (App Router, sans dossier `src/`), TypeScript strict, Tailwind CSS
- Postgres auto-hébergé (Proxmox) via Drizzle ORM et le driver `postgres`
- API Anthropic appelée côté serveur uniquement
- Zod pour toute validation d'entrée
- Vitest pour les tests
- Auto-hébergement complet sur Proxmox : une VM ou un LXC pour l'app, une VM isolée pour l'agent (Docker Compose)

## Commandes

- `npm run dev` : serveur de développement
- `npm run build` : build de production
- `npm run lint` : ESLint
- `npm run typecheck` : vérification TypeScript
- `npm test` : tests Vitest. Les tests d'intégration Postgres s'exécutent si `TEST_DATABASE_URL` pointe vers une base migrée, sinon ils sont ignorés
- `npm run db:generate` : génère une migration depuis `lib/db/schema.ts`
- `npm run db:migrate` : applique les migrations 

## Architecture

- `app/` : routes, pages, route handlers et server actions
  - `app/login/` : connexion. `app/(app)/` : pages protégées (le layout appelle `requireSession`)
  - `app/api/health` : sonde de santé publique. `app/manifest.ts` : manifest PWA
- `proxy.ts` : premier filtre d'authentification (Next 16 a renommé `middleware` en `proxy`). Les chemins publics sont dans son `matcher`.
- `lib/env.ts` : validation Zod des variables d'environnement par domaine (`getAuthEnv`, `getDbEnv`, `getAiEnv`), évaluée à l'appel (jamais à l'import)
- `lib/auth/` : session JWT HS256 (`session.ts`), comparaison de mot de passe à temps constant (`password.ts`), contrôle côté serveur (`dal.ts`)
- `lib/rate-limit.ts` : limiteur en fenêtre fixe dans Postgres. `lib/audit.ts` : journal d'audit. `lib/log.ts` : logs JSON avec masquage des secrets
- `lib/theme.ts` et `components/theme-toggle.tsx` : mode sombre par classe `dark`
- `lib/db/` : client Drizzle (`index.ts`) et schéma (`schema.ts`)
- `lib/prompts/` : prompts système envoyés à l'API Anthropic, un fichier par rôle
  (titre, questions, génération, affinage, découpage d'import). Ce sont les fichiers à modifier pour ajuster le comportement de l'IA.
- `drizzle/` : migrations SQL générées, à committer

## Conventions

- Aucun secret dans le code ni dans git. Toute variable d'environnement figure dans `.env.example`.
- La clé Anthropic ne quitte jamais le serveur : pas de `NEXT_PUBLIC_` pour elle, pas d'appel API depuis le client.
- Toute entrée utilisateur est validée avec Zod avant usage.
- Toute page, action serveur ou route protégée revérifie la session (`requireSession`) : le proxy ne suffit pas.
- Un chemin public doit être ajouté explicitement au `matcher` de `proxy.ts`, et justifié. Le manifest et les icônes sont publics car le navigateur les demande sans cookie.
- Les événements importants passent par `lib/log.ts` (JSON sur stdout) et les actions sensibles par `lib/audit.ts`. Aucun secret dans les logs.
- Lire les `cookies()` avant les variables d'environnement dans le code des pages, pour que le build n'exige aucun secret.
- Les routes qui appellent l'API Anthropic passent par le rate limiting.
- Base : rôles Postgres séparés (site, worker) avec le minimum de droits, mis en place avec l'infrastructure.
- Mobile-first, mode sombre, accessibilité de base (labels, contrastes, focus visible).
- Un commit par phase du plan, messages en français ou anglais clairs et atomiques.

## Pipeline automatique (phases 9 à 12 du plan)

Idée, approfondissement par l'IA, génération du prompt, création du repo GitHub, lancement de Claude Code dans un conteneur isolé sur la VM agent.
Un worker exécute les étapes via une file de tâches Postgres, avec journal détaillé, essais automatiques, réparation et pause avec actions manuelles.
Aucun force-push ni suppression de repo par l'agent. Notifications et commandes via Discord.

## Évolutions prévues (ne pas coder avant demande)

- Templates de prompt par type de projet
- Génération d'un `CLAUDE.md` en complément du prompt (`prompt_versions.kind` est extensible)
