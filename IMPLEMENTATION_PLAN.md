# IMPLEMENTATION PLAN — Idea Forge

> Découpage en phases. Règle : un commit par phase, lint + typecheck + tests au vert avant de passer à la suivante.

## Phases

| # | Phase | Contenu | Statut |
|---|---|---|---|
| 1 | Socle | Next.js, TypeScript strict, Tailwind, Drizzle, ESLint, Vitest | ✅ Fait |
| 2 | Authentification & schéma | Session JWT, rate limiting, audit, logs, schéma complet, interface mobile, PWA, thème | ✅ Fait |
| 3 | Capture & liste | Saisie rapide, liste, statuts, tags, recherche plein texte, titre généré par l'IA | ⏳ À faire |
| 4 | Clarification | Tours de questions, suggestions, réponses, « laisser l'IA choisir » | ⏳ |
| 5 | Génération | Prompt système de génération, streaming, enregistrement des versions | ⏳ |
| 6 | Versions & affinage | Historique, affinage par instruction, version finale, comparaison | ⏳ |
| 7 | Export & import | Copie, export Markdown, import d'un texte découpé en plusieurs idées | ⏳ |
| 8 | Infrastructure | Déploiement Proxmox (VM/LXC app, HTTPS), rôles Postgres séparés, sauvegardes | ⏳ |
| 9 | File de tâches | Table `jobs`, worker, verrouillage, essais automatiques | ⏳ |
| 10 | GitHub | Création du dépôt depuis le prompt final (sans force-push ni suppression) | ⏳ |
| 11 | Agent isolé | Lancement de Claude Code dans un conteneur sur la VM agent, journal détaillé | ⏳ |
| 12 | Supervision | Réparation, pause et actions manuelles, notifications et commandes Discord | ⏳ |

Les phases 3 à 8 reprennent les fonctionnalités MVP du PRD ; les phases 9 à 12 constituent le pipeline automatique.

## Critères de fin de phase

- [ ] `npm run lint` sans erreur
- [ ] `npm run typecheck` sans erreur
- [ ] `npm test` au vert (avec `TEST_DATABASE_URL` pour les tests Postgres)
- [ ] Migration générée et committée si le schéma change
- [ ] Nouvelles variables d'environnement ajoutées à `.env.example`
- [ ] Toute nouvelle route protégée appelle `requireSession()`
- [ ] Toute route appelant l'API Anthropic passe par le rate limiting

## Évolutions (après le plan)

- Templates de prompt par type de projet.
- Génération d'un `CLAUDE.md` en complément du prompt (`prompt_versions.kind = 'claude_md'`).

## Risques

| Risque | Parade |
|---|---|
| Coût de l'API Anthropic | Rate limiting, choix du modèle par variable d'environnement |
| Exécution de code par l'agent | VM dédiée, conteneur isolé, aucune action destructrice autorisée sur GitHub |
| Fuite de secrets | Validation Zod des variables, logs masqués, clé uniquement côté serveur |
