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
- `npm test` : tests Vitest
- `npm run db:generate` : génère une migration depuis `lib/db/schema.ts`
- `npm run db:migrate` : applique les migrations 

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
