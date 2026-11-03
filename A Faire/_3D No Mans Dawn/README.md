# NO MAN'S DAWN — WarLike Gaming

Jeu **Web 3D autonome**, sans WarLike Engine et sans Unity. Entrée : `index.html`.

## Technologie
- JavaScript modules natifs + Three.js (CDN), glTFLoader
- Un vrai personnage riggé glTF : Soldier.glb (exemple Three.js) avec animations ; connexion requise
- Terrain, forêt et bâtiments **géométriques temporaires**, pas encore les assets réalistes définitifs
- Déplacement TPS ZQSD/WASD, sprint Shift, caméra à la souris, interaction E, ressources, première mission de collecte.

## Exécution
Ouvrir via serveur HTTP (ex. publication Cloudflare Pages) et non par `file://`.
Le CDN Three.js et le modèle Soldier.glb sont requis pour la première version.
Cette version est un **prototype gameplay**, pas encore une simulation complète de survie.
Les anciens fichiers Unity C# sont des reliquats historiques et sont retirés de l'arborescence publiée lors de cette conversion.
