# Direction visuelle — Fiche Client Impôt

## Trois approches explorées

| Thème | Introduction très brève | Probabilité |
|---|---|---:|
| Atelier fiscal moderne | Une interface claire inspirée d’un bureau administratif soigné : papier, repères typographiques et outils précis. | 0.06 |
| Registre civique | Une esthétique de dossier public très structurée, avec une palette encre, ivoire et signalétique sobre. | 0.03 |
| Tableau opérationnel minéral | Un tableau de gestion lumineux, compact et calme, où les actions ont la priorité sur la décoration. | 0.08 |

## Approche retenue — Atelier fiscal moderne

### Mouvement de design

**Modernisme éditorial administratif.** Le produit emprunte à l’identité des registres imprimés de qualité, mais les traduit en une interface numérique fluide et compacte.

### Principes fondamentaux

1. **L’action avant l’ornement :** chaque zone doit faire avancer la fiche, guider une décision ou communiquer un état.
2. **Hiérarchie documentaire :** le titre, les sections, les champs et les preuves suivent une échelle typographique nette.
3. **Calme de gestion :** peu de couleurs, beaucoup d’espace utile, aucun tableau vide décoratif.
4. **Confidentialité visible :** l’état de session et l’effacement se comprennent au premier regard.

### Philosophie de couleur

L’ivoire chaud fournit un support doux et moins clinique que le blanc pur. Le bleu pétrole représente la fiabilité institutionnelle et structure la navigation. Le vert sarcelle indique l’action constructive et les états complets. Un ocre discret ne sert qu’aux alertes d’attention ; le rouge est réservé aux risques et aux suppressions.

### Paradigme de mise en page

Une **colonne de pilotage persistante** à gauche guide le travail, tandis qu’une zone de contenu éditoriale à droite alterne en-tête de tâche, résumé opérationnel et formulaire. Les fiches ne sont pas des grilles omniprésentes : les données sont regroupées en blocs verticaux et en cartes de sections.

### Éléments signatures

1. Une barre verticale sarcelle au bord des titres de section.
2. Un repère de session en forme de pilule : « Session locale — non enregistrée ».
3. Une règle fine ocre en haut de l’espace de travail, utilisée comme marque de progression et non comme décoration répétitive.

### Philosophie d’interaction

Les commandes principales restent proches de leur contexte. Une action destructrice demande confirmation ; une action de session ou d’impression explique immédiatement son effet. Les plugins visibles dans la navigation sont de vraies fonctions, jamais des éléments factices.

### Animation

Les changements de page utilisent seulement opacité et translation verticale légère, en moins de 220 ms. Les boutons répondent par une légère compression au clic. Les transitions décoratives sont désactivées quand `prefers-reduced-motion` est demandé. Les validations sont instantanées et les raccourcis clavier ne sont jamais retardés.

### Système typographique

**Manrope** sert aux données, libellés et tableaux grâce à sa lisibilité compacte. **DM Serif Display** est limité aux titres de haut niveau et crée une distinction éditoriale sans nuire au caractère administratif. Les titres sont denses ; les aides et métadonnées utilisent une taille plus petite et une couleur encre atténuée.

### Essence de marque

**Fiche Client Impôt est l’atelier de suivi fiscal temporaire, clair et imprimable, destiné aux équipes qui veulent structurer un dossier sans disperser de données personnelles.**

Personnalité : **précis, discret, méthodique**.

### Voix de marque

Les titres sont directs, documentaires et orientés vers l’étape suivante. Les actions décrivent le résultat exact.

> « Préparez la fiche avant de la transmettre. »

> « Effacer cette session locale. »

Les formulations génériques comme « Bienvenue » ou « Commencez maintenant » sont interdites.

### Logotype et symbole

Le symbole associe une feuille de dossier stylisée à une encoche verticale sarcelle, comme un interclassement de registre. Il est sans texte, à fort contraste et lisible à petite taille. Le mot-symbole est composé en DM Serif Display avec un espacement discret, jamais dans une police par défaut.

### Couleur signature

**Sarcelle d’atelier — `#0F766E`**. Cette couleur marque les actions, les repères de section et l’identité de l’outil.

## Style Decisions

- La colonne de pilotage gauche est obligatoire sur chaque page de bureau : elle porte le symbole, le mot-symbole, la fonction active, le parcours et l’état de session locale.
- Les surfaces de contenu sont traitées comme des pages de dossier : bordures réglées, ombres quasi absentes et groupements de registre, jamais comme des cartes SaaS flottantes.
- La règle ocre est un unique repère de progression au sommet de l’espace de travail ; le sarcelle conserve son rôle d’action constructive et de marqueur de section.
