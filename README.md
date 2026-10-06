# Idea Forge

De l'idée brute au prompt Claude Code. Web app perso, mono-utilisateur : on note une idée, l'IA pose des
questions de clarification, puis génère un prompt Claude Code structuré, versionné et exportable.

> Le README sera complété au fil des phases (déploiement Vercel, usage détaillé).

## Prérequis

- Node.js 22 ou plus
- Docker, pour le Postgres de développement
- Une clé API Anthropic

## Installation locale

```bash
npm install
docker compose -f compose.dev.yaml up -d
cp .env.example .env.local   # puis renseigner les valeurs
npm run db:migrate
npm run dev
```

L'app tourne sur http://localhost:3000.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `APP_PASSWORD` | Mot de passe d'accès à l'app |
| `SESSION_SECRET` | Secret de signature du cookie de session (32 caractères minimum) |
| `DATABASE_URL` | Chaîne de connexion Postgres |
| `COOKIE_SECURE` | `true` par défaut, `false` seulement pour un test en http |
| `ANTHROPIC_API_KEY` | Clé API Anthropic, côté serveur uniquement |
| `ANTHROPIC_MODEL` | Modèle utilisé, `claude-sonnet-5-5` par défaut |
| `PROMPT_LANGUAGE` | Langue des prompts générés, `fr` par défaut |

## Authentification

Un seul utilisateur. Le mot de passe est `APP_PASSWORD`. La session est un cookie httpOnly signé, valable 30 jours,
invalidé en changeant `SESSION_SECRET`. Après 5 échecs en 15 minutes depuis une même adresse, ou 20 échecs au total,
la connexion est bloquée. Chaque tentative est inscrite dans la table `audit_log`.

En production le site doit être servi en HTTPS : le cookie porte l'attribut Secure et le préfixe `__Host-`.
Pour tester en http hors localhost, mettre `COOKIE_SECURE=false`.

## Tests

```bash
TEST_DATABASE_URL=postgresql://forge:forge@localhost:5432/forge npm test
```

Sans `TEST_DATABASE_URL`, les tests qui ont besoin de Postgres sont ignorés.

## Icônes PWA

Les icônes de `public/icons/` sont générées depuis `assets/icon.svg` avec `node scripts/generate-icons.mjs`.

## Scripts

`npm run dev`, `build`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`.
