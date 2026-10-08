# BACKEND SCHEMA — Idea Forge

> Modèle de données PostgreSQL (source de vérité : `lib/db/schema.ts`, migrations dans `drizzle/`).

## 1. Vue d'ensemble

```
ideas 1 ──── n clarification_rounds 1 ──── n questions
  │ 1
  ├──── n prompt_versions (parent_version_id ↺ auto-référence)
  └──── final_version_id ──► prompt_versions

rate_limits   (indépendante)
audit_log     (indépendante)
```

## 2. Tables

### `ideas`
| Colonne | Type | Contraintes / rôle |
|---|---|---|
| `id` | uuid | PK, aléatoire |
| `title` | text | Titre (généré par l'IA par défaut) |
| `title_manual` | boolean | `true` si modifié à la main : l'IA ne le régénère plus |
| `raw_text` | text | Idée brute, obligatoire |
| `notes` | text | Notes libres |
| `status` | enum `idea_status` | `draft`, `clarifying`, `prompt_ready`, `in_dev`, `abandoned` |
| `tags` | text[] | Index GIN |
| `final_version_id` | uuid | FK → `prompt_versions.id`, `ON DELETE SET NULL` |
| `search` | tsvector | Généré : plein texte français sur titre + texte + notes, index GIN |
| `created_at`, `updated_at` | timestamptz | |

Index : `search` (GIN), `tags` (GIN), `status`, `created_at`.

### `clarification_rounds`
| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `idea_id` | uuid | FK → `ideas`, `ON DELETE CASCADE` |
| `round_number` | integer | Unique par idée |
| `created_at` | timestamptz | |

### `questions`
| Colonne | Type | Contraintes / rôle |
|---|---|---|
| `id` | uuid | PK |
| `round_id` | uuid | FK → `clarification_rounds`, `ON DELETE CASCADE` |
| `position` | integer | Unique par tour |
| `text` | text | Question posée |
| `suggestions` | jsonb (`string[]`) | Réponses proposées |
| `answer` | text | Réponse de l'utilisateur |
| `skipped` | boolean | `true` : l'IA choisit, signalé comme hypothèse dans le prompt |

### `prompt_versions`
| Colonne | Type | Contraintes / rôle |
|---|---|---|
| `id` | uuid | PK |
| `idea_id` | uuid | FK → `ideas`, `ON DELETE CASCADE` |
| `version_number` | integer | Unique par idée |
| `kind` | text | `generation` ou `refinement` (extensible : `claude_md`) |
| `content` | text | Prompt généré |
| `instruction` | text | Demande d'affinage à l'origine de la version |
| `parent_version_id` | uuid | FK → `prompt_versions`, `ON DELETE SET NULL` |
| `model` | text | Modèle Anthropic utilisé |
| `created_at` | timestamptz | |

### `rate_limits`
| Colonne | Type | Rôle |
|---|---|---|
| `key` | text | Ex. `login:ip:<ip>`, `login:global` |
| `window_start` | timestamptz | Début de la fenêtre fixe |
| `count` | integer | Incrémenté atomiquement (`ON CONFLICT DO UPDATE`) |

PK composite (`key`, `window_start`).

### `audit_log`
| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid | PK |
| `ts` | timestamptz | Index |
| `actor` | text | `owner`, `anonyme`, `worker` |
| `action` | text | `login_success`, `login_failed`, `login_blocked`, `logout`… (index) |
| `ip`, `user_agent` | text | |
| `details` | jsonb | Contexte, **jamais de secret** |

## 3. Tables prévues (pipeline, phases 9-12)

- `jobs` : file de tâches (type, statut, essais, verrou, dates) consommée par le worker.
- `job_logs` : journal détaillé par tâche.
- `projects` : lien idée ↔ dépôt GitHub créé.

## 4. Interfaces serveur

| Point d'entrée | Type | Rôle |
|---|---|---|
| `login(state, formData)` | Server action | Connexion, rate limit, audit |
| `logout()` | Server action | Déconnexion, audit |
| `GET /api/health` | Route handler public | Sonde de santé |
| Actions idées / clarification / génération / affinage / export | Server actions + streaming | Prévues aux phases 3 à 8 |
