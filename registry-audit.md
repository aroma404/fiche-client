# Audit des référentiels — 26 août 2026

## Objet

Ce document fixe la source de vérité de chaque liste déroulante avant sa centralisation. Il protège l’isolation par compte, évite de rendre modifiables des valeurs légales fermées et conserve le catalogue Registre de commerce exclusivement issu du fichier Excel fourni.

| Référentiel | Source actuelle | Politique cible | Usage suivi |
|---|---|---|---|
| Statut client | `program_client_statuses` | Administrable par compte | Dossiers clients |
| Forme juridique | `program_client_options` | Administrable par compte | Dossiers clients |
| Type de client | `program_client_options` | Administrable par compte | Dossiers clients |
| Régime fiscal | `program_client_options` | Administrable par compte | Dossiers clients |
| Type de contact | Constante serveur | Administrable par compte | Contacts des dossiers |
| Catégorie de coffre | Constante serveur | Administrable par compte | Accès chiffrés du dossier |
| Domaine d’activité | Constante contrôlée | Catalogue protégé | Dossiers clients |
| Activité auto-entrepreneur | Constante contrôlée | Catalogue protégé | Dossiers clients |
| Registre de commerce | Catalogue Excel partagé | Catalogue protégé en lecture seule | Dossiers clients, catégories et activités |
| Centre d’impôt | Constante contrôlée | Catalogue protégé | Dossiers clients |
| Statuts document / conformité / dossier | Enum de base | Référentiels protégés affichés | Données de conformité |
| Sens / catégorie finance | Enum de base | Référentiels protégés affichés | Registre du cabinet |

## Principes d’implémentation

Le registre partagé doit contenir l’identifiant stable, le libellé français, la source, les capacités d’administration, les dépendances et le nom de la procédure de suivi. Les routes métier ne reçoivent jamais un `accountId` du navigateur : elles déduisent toujours le compte de la session active. Les listes administrables sont créées à la demande pour le compte connecté, avec conservation de trente jours et blocage de l’archivage en cas d’usage.

Le Registre de commerce est traité comme un catalogue protégé. La page Réglages peut rechercher, compter et expliquer ses catégories et activités ; elle ne peut ni ajouter ni modifier une valeur issue de ce catalogue.
