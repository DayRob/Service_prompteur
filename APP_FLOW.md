# APP FLOW — Idea Forge

> Parcours utilisateur et enchaînement des écrans.

## 1. Plan du site

| Route | Accès | Rôle |
|---|---|---|
| `/login` | Public | Connexion par mot de passe |
| `/` | Protégé | Liste des idées, capture rapide, recherche |
| `/ideas/[id]` (prévu) | Protégé | Détail d'une idée : clarification, prompt, versions |
| `/api/health` | Public | Sonde de santé |
| `/manifest.webmanifest`, `/icons/*` | Public | PWA |

## 2. Connexion

```
Ouverture de l'app
   └─ session valide ? ── oui ──► /
                        └ non ──► /login
/login : saisie du mot de passe
   ├─ trop de tentatives ──► message « Réessaie dans N min » (audit : login_blocked)
   ├─ mot de passe faux ──► message d'erreur (audit : login_failed)
   └─ correct ──► cookie de session 30 j ──► / (audit : login_success)
Bouton « Quitter » ──► suppression du cookie ──► /login (audit : logout)
```

## 3. Parcours principal : de l'idée au prompt

```
[Liste] ── saisie rapide ──► idée créée (statut : brouillon)
                               │ l'IA génère un titre (modifiable à la main)
                               ▼
[Détail] ── « Clarifier » ──► tour de questions n° N (statut : clarification)
              │   chaque question : réponse libre, suggestion, ou « laisser l'IA choisir »
              │   ↺ nouveau tour possible si l'idée reste floue
              ▼
         « Générer » ──► prompt en streaming ──► version 1 (statut : prompt prêt)
              │
              ├─ « Affiner » + instruction ──► version N+1 (liée à sa version parente)
              ├─ « Marquer final » ──► version finale de l'idée
              └─ « Exporter » ──► copie dans le presse-papiers / fichier .md
```

## 4. Statuts d'une idée

```
draft ──► clarifying ──► prompt_ready ──► in_dev
  └──────────────┴──────────────┴──────► abandoned
```

## 5. Recherche et organisation

- Barre de recherche plein texte (titre, texte brut, notes), en français.
- Filtres par statut et par tags.
- Tri par date de création.

## 6. Pipeline automatique (phases 9-12)

```
Prompt final ──► « Lancer le développement »
   ──► tâche ajoutée à la file Postgres
   ──► worker : création du repo GitHub ──► lancement de Claude Code dans un conteneur isolé
   ──► journal détaillé, essais automatiques, réparation
   ──► en cas de blocage : pause + actions manuelles proposées
   ──► notifications et commandes via Discord
```

## 7. États d'erreur

- API Anthropic indisponible ou quota dépassé : message clair, l'idée reste enregistrée, nouvel essai possible.
- Rate limit atteint : délai d'attente affiché.
- Session expirée : redirection vers `/login`, puis retour à l'accueil.
