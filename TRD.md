# TRD — Idea Forge

> Technical Requirements Document : le *comment* technique.

## 1. Stack

| Couche | Choix | Raison |
|---|---|---|
| Framework | Next.js 16 (App Router, sans `src/`), React 19 | Server actions et route handlers dans un seul projet |
| Langage | TypeScript strict | Sûreté du typage de bout en bout |
| UI | Tailwind CSS 4, variables CSS de thème | Mobile-first, mode sombre par classe `dark` |
| Base de données | PostgreSQL 17 auto-hébergé | Recherche plein texte française, file de tâches, rate limiting |
| ORM | Drizzle ORM + driver `postgres`, migrations `drizzle-kit` | Schéma typé, SQL lisible |
| IA | SDK `@anthropic-ai/sdk`, appels côté serveur uniquement | La clé ne quitte jamais le serveur |
| Validation | Zod 4 | Toute entrée utilisateur et toute variable d'environnement |
| Auth | JWT HS256 via `jose`, cookie httpOnly | Mono-utilisateur, sans dépendance externe |
| Tests | Vitest (unitaires + intégration Postgres optionnelle) | |
| Hébergement | Proxmox : VM/LXC pour l'app, VM isolée pour l'agent (Docker Compose) | Isolation de l'exécution de code |

## 2. Architecture

```
Navigateur (PWA) ──HTTPS──► proxy.ts (filtre de session)
                               │
                               ▼
                 App Router : pages, server actions, route handlers
                   │ requireSession() revérifie chaque accès
                   ├──► lib/db (Drizzle) ──► PostgreSQL
                   └──► lib/prompts + SDK Anthropic (streaming)

Pipeline (phases 9-12) : worker ──► file de tâches Postgres ──► GitHub API
                                                         └──► conteneur Claude Code (VM agent)
```

## 3. Sécurité

- **Authentification** : mot de passe unique `APP_PASSWORD` (12 caractères minimum), comparé à temps constant ; session JWT HS256 signée par `SESSION_SECRET`, cookie `__Host-forge_session` (httpOnly, Secure, SameSite=Lax), validité 30 jours.
- **Défense en profondeur** : `proxy.ts` filtre toute requête ; chaque page, action et route revérifie la session via `lib/auth/dal.ts`. Les chemins publics (login, `/api/health`, manifest, icônes) sont listés explicitement dans le `matcher`.
- **Rate limiting** en fenêtre fixe dans Postgres (atomique, multi-processus) : 5 échecs de connexion / 15 min par IP, 20 au total ; appliqué aussi aux routes qui appellent l'API Anthropic.
- **Audit** : connexions, échecs, blocages et actions sensibles dans `audit_log`.
- **Logs** JSON sur stdout avec masquage des secrets (`lib/log.ts`).
- **Secrets** : aucun dans le code ni dans git ; toutes les variables sont documentées dans `.env.example` et validées par domaine (`getAuthEnv`, `getDbEnv`, `getAiEnv`) au moment de l'appel, jamais à l'import, pour que le build n'exige aucun secret.
- **Base** : rôles Postgres séparés (site, worker) avec le minimum de droits.

## 4. Variables d'environnement

| Variable | Rôle |
|---|---|
| `APP_PASSWORD` | Mot de passe d'accès |
| `SESSION_SECRET` | Secret de signature de session (32 caractères min.) |
| `DATABASE_URL` | Connexion Postgres |
| `COOKIE_SECURE` | `true` en production (HTTPS) |
| `ANTHROPIC_API_KEY` | Clé API, serveur uniquement |
| `ANTHROPIC_MODEL` | Modèle utilisé (par défaut `claude-sonnet-5-5`) |
| `PROMPT_LANGUAGE` | Langue des prompts générés (`fr`) |

## 5. IA

- Un fichier de prompt système par rôle dans `lib/prompts/` : titre, questions, génération, affinage, découpage d'import.
- Génération et affinage en **streaming** vers le client.
- Chaque version enregistre le modèle utilisé.

## 6. Qualité

- `npm run lint`, `npm run typecheck`, `npm test` avant chaque commit.
- Tests d'intégration Postgres activés si `TEST_DATABASE_URL` pointe vers une base migrée.
- Un commit par phase du plan d'implémentation.

## 7. Contraintes

- Next.js 16 : `middleware` renommé `proxy`, API parfois différentes des versions antérieures (lire la doc embarquée dans `node_modules/next/dist/docs/`).
- Lire `cookies()` avant les variables d'environnement dans les pages.
