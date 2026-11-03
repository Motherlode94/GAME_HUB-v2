# Classification WarLike Gaming — rétablie le 3 novembre 2026

## Dossiers et statuts

| Dossier | Nombre de jeux | Signification |
|---|---:|---|
| `DONE/` | **28** | Classement historique « terminé », en attente de validation QA complète pour tout titre non certifié |
| `A Faire/` | **23** | Prototypes et jeux encore en développement, en correction ou en test |
| `A Revoir/` | **5** | Projets à restructurer, reprendre ou réévaluer |

Les jeux sont classés selon leur **dossier GitHub**, et le portail les affiche avec les mêmes statuts et compteurs. Un jeu dans `DONE` n'est **pas automatiquement certifié sans bugs**.

### Restauration du classement historique

L'inversion globale effectuée au commit `1ea595c` a été annulée pour les jeux qui existaient auparavant. La source de référence est son parent `da699bc` :

- 28 jeux qui avaient été déplacés de `DONE` vers `A Faire` sont revenus dans `DONE` avec leurs fichiers les plus récents.
- 7 jeux déplacés de `A Faire` vers `DONE` reviennent dans `A Faire`.
- Les neuf prototypes non vérifiés (Gestion Tycoon, GodSworm, Mario Like, MineCraft, Neo Soccer 2D, Racing, Shooter, Tennis Man, Zombie Shooter) étaient déjà dans `A Faire` avant l'inversion : ils y restent.
- Les nouveaux projets créés depuis l'inversion, dont Étage Zéro, SILENCE 03, NÉRÉIDE, Ashen Bell et Black Veil, restent dans `A Faire`.
- Les cinq projets `A Revoir` n'ont pas bougé.

**Aucune deuxième copie d'un jeu n'est créée.** Les ressources mutualisées (`A Faire/_shared`, `DONE/_SharedAssets`) conservent leur emplacement ; leurs références depuis les jeux déplacés sont mises à jour.

## Règles de promotion

Pour classer définitivement un jeu comme terminé, vérifier en conditions réelles :
- Démarrage et chargement des ressources sans erreur.
- Commandes clavier/souris/manette/tactile selon les plateformes ciblées.
- Boucle de gameplay complète avec objectifs atteignables.
- Sprites, animations et effets correctement affichés.
- Absence de bugs bloquants, comportements IA plausibles et stabilité suffisante.
- Tests représentatifs et validation manuelle du rendu.

Le classement historique rétabli est **une information de rangement**, et non une affirmation que chaque jeu a réussi ces critères.

## Contrôles

```bash
node scripts/check-game-classification.cjs
node scripts/qa-done.cjs
node scripts/check-game-catalog.mjs
node scripts/check-horror-trio.mjs
```

Les contrôles automatiques vérifient notamment la correspondance entre les dossiers et les URLs du portail, les ressources locales et certains scénarios de gameplay. Ils ne remplacent pas une session de QA en navigateur.
