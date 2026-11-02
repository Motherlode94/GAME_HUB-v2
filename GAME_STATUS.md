# Organisation des jeux WarLike

## A Faire
Tous les jeux encore en prototypage, à corriger, à équilibrer ou en attente de validation. Une page qui se charge, un jeu répertorié ou un test syntaxique ne suffisent pas à déclarer un jeu terminé.

## DONE
Jeux classés comme terminés historiquement. Cette catégorie n'est **pas une certification QA** : les sept jeux actuellement conservés demandent encore une validation explicite de lancement, commandes, gameplay, objectifs, stabilité et mobile.

## Conditions de passage de A Faire vers DONE
- Chargement sans erreur bloquante.
- Contrôles clavier/souris (et tactile si prévu) cohérents.
- Une boucle de jeu complète jouable et un objectif atteignable.
- Images / sprites accessibles et correctement chargés.
- Aucun bug critique constaté lors des tests représentatifs.
- Catalogue et URL du jeu fonctionnels.
- Validation humaine ou rapport de tests reproductibles.

## Réorganisation du 2 novembre 2026
Neuf prototypes non référencés dans le catalogue (Gestion Tycoon, GodSworm, Mario Like, MineCraft, Neo Soccer 2D, Racing, Shooter, Tennis Man, Zombie Shooter) déplacés de DONE vers A Faire sans effacer leurs fichiers. Ils ont été ajoutés au catalogue. Sept titres déjà référencés restent dans DONE, en attente d'une validation de qualité plus stricte.

## Contrôle statique automatisé

À la racine du dépôt, avec Node.js 20.11+ :

```bash
node scripts/check-game-catalog.mjs
```

Ce contrôle vérifie : identifiants du catalogue dupliqués, chemins d'entrée, dépendances locales des pages, syntaxe des scripts JavaScript classiques et présence d'une page d'entrée. Les jeux marqués DONE restent accompagnés d'un avertissement de validation manuelle.

**Limites :** le contrôle n'exécute pas les jeux, ne garantit pas le bon fonctionnement de la physique, de l'IA ou des contrôles, ne vérifie pas les URLs distantes et ne simule pas le navigateur. Il ne remplace pas les essais de gameplay.
