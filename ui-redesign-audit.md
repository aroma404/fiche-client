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

## Ajustements de session et navigation mobile

La page Connexion a de nouveau été contrôlée à 390 px : le rappel « Sinon, la session est limitée à 5 minutes et se ferme avec le navigateur » est affiché directement sous « Se souvenir de moi », avec une hiérarchie lisible et sans débordement. Le panneau burger mobile possède désormais un contexte d’empilement isolé et un niveau supérieur au contenu et à l’en-tête ; il conserve le verrouillage du défilement, la fermeture par Échap, par voile et lors du changement de route. La session navigateur disponible au moment de la vérification était déconnectée, donc aucun dossier réel n’a été consulté.

Un rechargement complet de `/connexion` affiche d’abord le squelette de transition puis le formulaire final sans erreur de rendu ni écran vide persistant. Le rappel de session et le lien de convention restent présents après ce cycle de rechargement.

## Confirmation utilisateur — navigation mobile

Le 26 août 2026, l’utilisateur a confirmé après essai que le problème du menu burger est résolu. Cette confirmation complète les contrôles automatisés de superposition, de fermeture par Échap, de fermeture au changement de route et de verrouillage du défilement.

Une session de test authentifiée et vide a ensuite été ouverte sur `/dashboard`. Le déclenchement du burger depuis le DOM confirme un dialogue modal ouvert, `z-index: 100`, une sidebar visible dans le dialogue et le défilement du document verrouillé. La touche Échap referme ensuite le panneau et rétablit la vue du tableau de bord. Aucun dossier réel n’a été consulté ni créé.

Dans la même session, le clic sur le voile ferme le dialogue et rétablit le défilement. L’ouverture du panneau puis le clic sur « Dossiers clients » mène à `/clients`, ferme automatiquement le dialogue et rétablit aussi le défilement. Ces contrôles couvrent la superposition, le voile, Échap et la fermeture au changement de route.

Lors de la vérification finale de Réglages depuis la même session authentifiée, le squelette de chargement est resté visible après le chargement différé. Cette observation est traitée comme un incident de rendu à diagnostiquer avant la sauvegarde de la version.

Après un redémarrage propre du serveur de développement, la même route `/reglages` se charge normalement dans la session de test. La page affiche les cinq listes administrables (formes juridiques, types de client, régimes fiscaux, types de contact et catégories d’accès), la carte de suivi de tous les référentiels, ainsi que le catalogue RC issu du fichier Excel avec 99 catégories et 2 130 activités, sans action d’ajout libre.

La page Finances du cabinet a été ouverte avec le compte de test vide : le registre ne montre aucun mouvement, le formulaire propose explicitement « Dossier client » et « Client non enregistré », et l’observation est libellée comme interne et non affichée dans le registre. Une tentative de clic automatisé sur le second choix a expiré sans créer de donnée ; le basculement est vérifié par un contrôle DOM alternatif.

## Réglages opérationnels — contrôle initial

Le 27 août 2026, la session de contrôle authentifiée a confirmé que Réglages du programme n’apparaît plus dans le rail principal. Il est accessible par la carte profil, où le bandeau horizontal « Mon compte / Réglages du programme » est affiché, suivi des onglets Dossiers, Listes du cabinet, Registre de commerce et Archives. Le premier essai de clic automatisé sur l’onglet RC a expiré sans modification de données ; un contrôle alternatif reste à réaliser.

Le contrôle alternatif par interaction DOM a ouvert l’onglet Registre de commerce. Le rendu affiche les compteurs du catalogue de référence, la recherche de catégories, la source active et les actions « Choisir le fichier Excel ou CSV », « Ajouter / mettre à jour », « Remplacer complètement » et « Réinitialiser ». Aucun fichier ni donnée n’a été envoyé pendant ce contrôle.

Après redémarrage du serveur, la route Réglages se charge normalement dans la session authentifiée. Les statuts et les trois listes liées aux dossiers sont bien éditables dans l’onglet Dossiers, tandis que le rail principal ne contient pas de lien Réglages. Le passage programmatique vers Registre de commerce est déclenché sans import ni écriture ; l’affichage final du panneau est contrôlé séparément après le cycle de rendu React.

## Contrôle de sécurité avant CRUD RC

Le 27 août 2026, un accès direct à la route privée de Réglages sans session active redirige vers la page publique, sans afficher les référentiels ni les données d’un compte. Aucun dossier ni compte de l’utilisateur n’a été lu, modifié ou supprimé durant ce contrôle.
