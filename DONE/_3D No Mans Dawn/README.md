# WARLIKE — NO MAN'S DAWN

**Statut : préproduction / prototype 0.1 « Le Refuge »**

Projet de survie 3D solo TPS pour Unity 6 (URP, C#), organisé dans `DONE` du GAME_HUB-v2.

## Première tranche jouable

- Un survivant contrôlable et animé (modèle 3D riggé à importer)
- Une ferme fortifiable et un village explorables
- Inventaire, ramassage, faim, soif, fatigue et blessures
- Deux survivants et des pillards avec comportements autonomes
- Un pick-up à diagnostiquer, réparer et conduire
- Une mission de refuge, sauvegarde et reprise

## Structure

`Assets/_WarLike/` regroupe le code, les scènes, les préfabriqués, l'art et les systèmes.

Les sous-dossiers sont actuellement des emplacements réservés. **Aucun modèle 3D, aucune scène Unity ni gameplay fonctionnel ne sont encore présents.** Importer ensuite les vrais assets sous leurs répertoires respectifs ; ne pas utiliser des cubes comme substituts aux personnages ou véhicules finaux.

## Démarrage Unity

Créer un projet Unity 6 URP local, puis intégrer le dossier `Assets/_WarLike/` dans son dossier `Assets`. Ajouter les scènes `TestGround`, `Refuge` et `MainMenu` depuis l'éditeur Unity ; ne pas créer de faux fichiers `.unity`.

## Premier objectif

Valider modèle riggé + animations + contrôleur TPS + collisions + caméra dans `TestGround` avant l'assemblage de la ferme.
