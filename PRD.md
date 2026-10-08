# PRD — Idea Forge

> Product Requirements Document : le *quoi* et le *pourquoi* du produit.

## 1. Résumé

Idea Forge est une web app personnelle, mono-utilisateur, qui transforme une **idée brute** en **prompt Claude Code complet et structuré**. L'IA pose des questions de clarification, génère le prompt en streaming, puis permet de le versionner, de l'affiner et de l'exporter. À terme, un pipeline automatique crée le dépôt GitHub et lance Claude Code dans un environnement isolé.

## 2. Problème

- Les idées de projets arrivent n'importe quand (téléphone, transports) et se perdent dans des notes éparses.
- Un prompt Claude Code de qualité demande du temps : contexte, stack, contraintes, critères d'acceptation. Sans cadre, il manque toujours quelque chose.
- Passer de l'idée au premier commit implique beaucoup d'étapes manuelles (repo, prompt, lancement de l'agent).

## 3. Utilisateur cible

Un seul utilisateur : le propriétaire de l'instance (développeur / ingénieur), sur mobile comme sur ordinateur. Pas de comptes multiples, pas de partage.

## 4. Objectifs

| Objectif | Mesure de réussite |
|---|---|
| Capturer une idée en quelques secondes | Saisie possible en moins de 10 s depuis le téléphone (PWA) |
| Obtenir un prompt exploitable sans réécriture | Le prompt final est utilisé tel quel dans Claude Code |
| Garder l'historique | Toutes les versions d'un prompt sont conservées et comparables |
| Automatiser le passage au code (phase 2 du produit) | Idée → repo GitHub → première exécution de Claude Code sans action manuelle |

## 5. Fonctionnalités

### MVP
1. **Capture rapide** d'une idée (texte brut), titre généré par l'IA, modifiable à la main.
2. **Liste des idées** avec statut (`brouillon`, `clarification`, `prompt prêt`, `en dev`, `abandonnée`), tags et **recherche plein texte** en français.
3. **Questions de clarification** par tours successifs ; chaque question propose des suggestions. Une question peut être passée : l'IA choisit et le signale comme hypothèse.
4. **Génération du prompt en streaming**.
5. **Versions** : chaque génération ou affinage crée une version ; une version peut être marquée finale.
6. **Affinage** par instruction libre (« ajoute des tests », « passe en Python »).
7. **Export** du prompt (copie, fichier Markdown).

### Après MVP
- **Import** d'un texte long découpé en plusieurs idées par l'IA.
- **Pipeline automatique** : création du repo GitHub, lancement de Claude Code dans un conteneur isolé, suivi des tâches, notifications et commandes Discord.
- Templates de prompt par type de projet ; génération d'un `CLAUDE.md` en complément.

## 6. Hors périmètre

- Multi-utilisateur, partage, collaboration.
- Exécution de code non isolée sur la machine de l'app.
- Actions destructrices de l'agent sur GitHub (force-push, suppression de dépôt).

## 7. Exigences non fonctionnelles

- **Sécurité** : accès par mot de passe, session signée, limitation des tentatives, journal d'audit, clé API jamais exposée au client.
- **Mobile-first**, installable en PWA, mode sombre.
- **Accessibilité** de base : labels, contrastes, focus visible.
- **Auto-hébergement** complet (Proxmox), aucune dépendance SaaS hors API Anthropic.
- Interface et prompts générés **en français**.
