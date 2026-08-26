# Audit visuel de départ — refonte UI

Les pages publiques actuelles utilisent déjà une palette ivoire, pétrole et sarcelle, ainsi qu’un contraste entre titre serif et texte d’interface compact. La refonte doit conserver ces fondations mais les transformer en langage de dossier fiscal : surfaces plus planes, règles fines, marqueurs verticaux sarcelle, accent ocre ponctuel et hiérarchie documentaire.

La page de connexion doit abandonner le titre « Bienvenue » au profit d’un intitulé opérationnel. Les pages publiques et privées doivent partager une même grammaire de poste de travail administratif plutôt que des cartes SaaS flottantes. Les fonctions, données, accès et règles existants ne doivent pas être modifiés.

## Validation du socle public reconstruit

Les pages d’accueil et de connexion suivent désormais la même feuille de registre : lignes documentaires discrètes, axe vertical sarcelle, règles administratives, surfaces plates, accent ocre et titres opérationnels. Le mot « Bienvenue » a été supprimé. Le prochain passage applique cette grammaire aux écrans métier privés et aux formulaires existants.

## Vérification mobile

Les pages publiques, l’ouverture de session et la convention restent lisibles à 390 px de large : la grille se replie sans débordement, les actions restent atteignables et les surfaces documentaires gardent leur hiérarchie. La navigation mobile privée est gérée par le nouveau panneau latéral déclenché depuis l’en-tête.

## Vérification des routes

La création de compte a été vérifiée dans la nouvelle identité visuelle. Le test de `/clients` a révélé un appel de contexte avant le montage de l’espace de travail ; la page a été séparée en coque et contenu afin que le contexte soit désormais disponible avant lecture. Le contrôle TypeScript est redevenu valide après correction.

La vérification suivante de `/clients` confirme le retour propre vers l’accès sécurisé, sans fuite de données ni erreur de contexte. La route `/archives` est également correctement protégée sur mobile. Les surfaces Archives, Transferts et Finances ont en parallèle reçu leurs styles explicites de registre.

## Contrôle authentifié prévu

La session navigateur persistante ne contenait aucun compte connecté : les routes privées redirigent correctement vers l’accès sécurisé. La création de compte reprend bien la nouvelle feuille de registre. Un compte de contrôle temporaire, supprimé à la fin du parcours, permettra de vérifier les vues privées sans utiliser de données utilisateur.

Les champs du compte de contrôle temporaire ont été remplis dans la nouvelle mise en page ; la convention obligatoire est activée avant l’ouverture de l’espace. Aucun dossier client réel n’est utilisé pour cette vérification.

## Tableau de bord authentifié

Le compte de contrôle ouvre le tableau de bord sans erreur. La grille de bureau a été vérifiée : barre latérale fixe, marque de registre, en-tête de pilotage, indicateurs documentaires, actions et états vides restent lisibles et structurés sur fond ivoire. La session est limitée au compte temporaire de contrôle.

## Création de dossier authentifiée

La fiche d’ouverture du dossier a été vérifiée dans le compte temporaire : sections numérotées, libellés de formulaire, contrôles de sélection et action de création restent cohérents avec la navigation latérale et le registre de pilotage. Un dossier de contrôle minimal est utilisé uniquement pour l’examen des onglets privés.

## Fiche et contacts authentifiés

La fiche client du dossier temporaire a été vérifiée après le chargement complet : en-tête de dossier, onglets Fiche/Documents/Conformité/Paiements/Accès/Impression, cartes de références et bloc Contacts utilisent la même trame de registre. Le lien WhatsApp du numéro local de contrôle respecte la normalisation `213…` sans modifier la valeur affichée dans la fiche.

## Paiements et accès authentifiés

Les deux onglets ont été vérifiés sur bureau dans le dossier temporaire. Paiements présente son registre, ses indicateurs et ses observations avec la nouvelle hiérarchie visuelle. Accès affiche le formulaire rattaché au seul dossier, le filtre de catégorie, la recherche locale et les états vides, sans exposer de mot de passe ni de donnée d’un autre dossier.

## Transferts et finances authentifiés

Les routes Transferts et Finances ont été contrôlées dans le compte temporaire. Les panneaux Exporter/Importer forment désormais deux feuilles de registre distinctes avec une notice de sécurité lisible. Finances conserve un tableau de mouvements et un formulaire latéral structurés, avec indicateurs séparés et libellés de saisie uniformes.

## Compte et réglages authentifiés

Mon compte a été contrôlé : les quatre surfaces de sécurité, les champs et la zone sensible reprennent les marqueurs documentaires sans réduire la lisibilité. Réglages du programme a été vérifié avec ses statuts et ses listes administrables ; les rangées éditables, sélecteurs et actions restent structurés dans les nouveaux panneaux de registre.

## Archives et impression authentifiées

Archives a été vérifié avec ses états vides : avertissement de rétention, compteurs et sections de restauration suivent la trame de registre. La fiche d’impression du dossier temporaire présente son document administratif, ses rubriques et les actions PDF/impression avec une hiérarchie claire, sans aucune mention de plateforme externe.

## Nettoyage du contrôle

Avec l’autorisation explicite de l’utilisateur, la suppression du compte de contrôle et de son dossier temporaire a été déclenchée depuis la zone sensible de Mon compte. La session a immédiatement cessé d’être autorisée, ce qui confirme l’invalidation de la session de contrôle ; une vérification finale de redirection est effectuée avant livraison.

La nouvelle ouverture de `/dashboard` redirige vers Connexion. Le compte temporaire ne dispose donc plus d’une session exploitable ; la vérification de la suppression des données de contrôle est maintenant réalisée sans modification supplémentaire de la base.

Le nettoyage confirmé a supprimé le compte temporaire et ses données dépendantes. Une vérification de comptage limitée à l’e-mail de contrôle et au dossier de contrôle retourne zéro pour les deux, sans consulter ni modifier les autres comptes.

## Gabarits partagés et comportement compact

La revue du gabarit de l’espace de travail confirme un rail de bureau séparé et un panneau latéral mobile déclenché par un bouton dédié sous le seuil `lg`, avec fermeture automatique au changement de route. L’en-tête, les titres de page, les marges de contenu et les tables de registre reposent sur les mêmes composants partagés ; les écrans publics avaient déjà été contrôlés à 390 px, sans débordement ni action inaccessible.
