# Mesure reproductible — connexion et navigation

Le 25 août 2026, le même scénario Playwright éphémère a comparé le checkpoint `42caa8a5` à la version optimisée. Il crée un compte technique, se connecte, recharge le Dashboard pour contrôler la session, ouvre Clients puis Importer et exporter, avant de supprimer le compte.

| Indicateur | Checkpoint `42caa8a5` | Version optimisée | Écart |
|---|---:|---:|---:|
| Réponse `account.login` | 171 ms | 166 ms | -2,9 % |
| Réponse `account.me` après rechargement | 203 ms | 170 ms | -16,3 % |
| Premier Dashboard observable | 205 ms | 210 ms | Comparable dans la variance locale |
| Lots privés post-login observés | 4 | 3 | -25,0 % |
| Navigation Clients après préchargement | non instrumentée | 61 ms | mesure actuelle |
| Navigation Transferts après préchargement | non instrumentée | 59 ms | mesure actuelle |

La sécurité reste inchangée : le mot de passe continue d’être vérifié avec le hachage scrypt, le jeton de session reste HttpOnly et chaque procédure métier conserve la résolution du compte côté serveur. Les liens privés conservent l’écran actif jusqu’à ce que le module de destination soit prêt ; aucune apparition du fallback `Ouverture de votre espace…` n’a été observée dans le scénario courant.
