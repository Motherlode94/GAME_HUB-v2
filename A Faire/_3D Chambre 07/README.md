# CHAMBRE 07 — La Voix

Prototype autonome de jeu d'horreur psychologique à la première personne, original et indépendant de MiSide.

## Lancement

Servir la racine du dépôt en HTTP et ouvrir `A Faire/_3D Chambre 07/index.html`. Accessible également depuis la page d'accueil du Game Hub.

## Gameplay

- ZQSD/WASD : déplacement ; Maj : courir ; souris ou flèches gauche/droite : tourner ; E : interagir ; Échap : pause.
- Récupérer la photo, l'enregistrement et la lettre ; parler ensuite à Lia ; atteindre la porte en échappant à la présence.
- Deux fins selon le choix de dialogue. Sauvegarde locale sous la clé `warlike.chambre07.v1`.

## Portée et limites

Il s'agit d'une **démo 2.5D à raycasting**, pas encore d'un rendu polygonal 3D intégral avec animation de personnages et éclairage volumétrique. Les personnages sont représentés par des volumes stylisés. L'ennemi utilise une poursuite directe avec collisions simples, pas un pathfinding complet. Le son, le doublage, les cinématiques et les scènes multiples sont à développer.

La copie dans `WarLike-Engine/examples/chambre-07` est une **démo HTML embarquée** dans le navigateur des démos Engine. Elle ne crée pas encore une scène native éditable dans Hierarchy/Inspector ni exportable par le pipeline Engine.

## Validation à effectuer

1. Jouer entièrement aux deux parcours et vérifier que les trois objets sont accessibles.
2. Vérifier les collisions, les positions de poursuite et la réponse du clavier/souris.
3. Tester la reprise de sauvegarde et le retour après pause.
4. Tester Chrome, Edge, Firefox, les petites résolutions et le lancement embarqué depuis Engine.
5. Ajouter des modèles originaux, le son, de vrais scripts et un contrôleur 3D natif WarLike.
