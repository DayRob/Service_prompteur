# DESIGN BRIEF — Idea Forge

> Intentions visuelles et règles d'interface.

## 1. Personnalité

Un **outil de travail** sobre et rapide, pensé pour le pouce : on ouvre, on note, on repart. Pas de décoration, l'attention va au texte de l'idée et au prompt.

## 2. Principes

1. **Mobile-first** : largeur de contenu max. `max-w-3xl`, gouttières de 16 px, zones tactiles confortables, respect des *safe areas* iOS.
2. **Le texte avant tout** : typographie lisible, prompt affiché en police à chasse fixe.
3. **Une action principale par écran**, mise en avant par la couleur d'accent.
4. **Retour immédiat** : streaming visible pendant la génération, états de chargement explicites.
5. **Installable** : PWA plein écran (`display: standalone`), icônes dédiées dont une version *maskable*.

## 3. Couleurs (variables CSS)

| Jeton | Clair | Sombre | Usage |
|---|---|---|---|
| `--background` | `#fafafa` | `#09090b` | Fond de page |
| `--foreground` | `#18181b` | `#f4f4f5` | Texte principal |
| `--surface` | `#ffffff` | `#18181b` | Cartes, champs |
| `--muted` | `#52525b` | `#a1a1aa` | Texte secondaire |
| `--border` | `#e4e4e7` | `#27272a` | Bordures |
| `--accent` | `#4f46e5` | `#818cf8` | Actions principales, liens |
| `--danger` | `#b91c1c` | `#f87171` | Erreurs, suppression |

Thème clair / sombre basculé par la classe `dark` (bouton dans l'en-tête), sombre par défaut pour la PWA.

## 4. Typographie

- Texte : pile système sans-serif.
- Prompt et code : `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- Titres courts, `font-semibold`, `tracking-tight`.

## 5. Composants

- **En-tête collant** : nom de l'app, bascule de thème, bouton « Quitter », fond translucide flouté.
- **Boutons** : principal (accent plein), secondaire / *ghost* (texte seul).
- **Carte d'idée** : titre, extrait, statut (badge), tags, date.
- **Question de clarification** : intitulé, puces de suggestions cliquables, champ libre, option « laisser l'IA choisir ».
- **Visionneuse de prompt** : bloc monospace, boutons Copier / Exporter / Affiner, sélecteur de version.

## 6. Accessibilité

- Chaque champ a un label.
- Contrastes conformes WCAG AA dans les deux thèmes.
- Focus clavier toujours visible.
- Langue du document : `fr`.
