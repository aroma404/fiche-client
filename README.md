# Fiche Client Impôt

Application React et TypeScript en français destinée au suivi temporaire d’une fiche fiscale. Les saisies restent exclusivement dans l’état de la page et disparaissent au rechargement ; aucune donnée client n’est écrite dans `localStorage`, dans un cookie métier, dans une API ou dans une base de données.

## Architecture des plugins

Chaque fonctionnalité vit dans `client/src/plugins/<plugin>/index.tsx` et est déclarée dans `client/src/core/plugin-registry.ts`. Le registre utilise le contrat `FeaturePlugin` défini dans `client/src/core/plugin-contract.ts`.

| Opération | Action |
|---|---|
| Ajouter un plugin | Créer un dossier dans `plugins/`, exporter son composant et l’ajouter au registre |
| Retirer un plugin | Retirer son entrée du registre ; les autres plugins et routes restent isolés |
| Modifier les données temporaires | Ajuster les types dans `types/fiche.ts` et les actions dans `core/session-store.tsx` |
| Modifier la charte | Adapter les variables et les règles dans `client/src/index.css` |

## Commandes

```bash
pnpm check
pnpm build
pnpm dev
```

## Limite fonctionnelle volontaire

Le produit ne doit pas être utilisé pour stocker des mots de passe ou des secrets. Toute future fonction de sauvegarde durable nécessitera un backend, une authentification, des droits d’accès et une politique de conservation explicite avant son activation.
