# WarLike Civilian Pack — 60 personnages

## Contenu du dépôt

- **60 personnages civils** : les 24 personnages narratifs du pack initial et 36 nouveaux civils professionnels C25–C60.
- **240 illustrations SVG** : un portrait, une pose fixe et deux variantes de marche par personnage.
- **Une galerie Web** dans `index.html` avec recherche, filtre par jeu, prévisualisation animée, fiches et téléchargement d'images SVG.
- **Intégration visuelle** dans les **7 jeux du dossier `DONE`** à l'aide de `site-integration.js` et `site-integration.css`.

Les SVG sont des illustrations vectorielles transparentes, pas des modèles 3D et pas des PNG découpés à partir des planches générées. Le pack PNG issu des **trois planches C01–C60** est livré séparément dans la conversation ChatGPT sous `WarLike_Civilian_60_PNG.zip`. Ces images doivent être contrôlées puis éventuellement retouchées avant d'être publiées comme assets en ligne.

## Intégrations

- **After Dark** : portraits des interlocuteurs en cours, dans la scène.
- **Hearts of Eden** : portraits dans les cartes des personnages.
- **Agence X** : portraits du casting et sur le plateau.
- **The Silent Verdict** : portrait du suspect lorsque la bibliothèque possède son identité.
- **No Man's Dawn** : fiche de Mara dans le HUD.
- **Redline District** : portraits décoratifs du paddock dans le menu.
- **The Last Signal** : dossier illustré du personnel dans le menu.

L'intégration affiche des illustrations, elle ne crée pas automatiquement des PNJ 3D, de nouvelles quêtes, ni des comportements d'IA.

## Configuration

Les sites chargent le pack à partir de leur parent `DONE/_SharedAssets/civilians/`.
Une connexion HTTP(S) est nécessaire pour `fetch('manifest.json')`.
Le téléchargement des illustrations se fait image par image depuis la galerie.

## Limites et qualité

Les 36 nouveaux SVG sont des variantes illustrées originales générées sous forme vectorielle avec différentes tenues et accessoires. Certains personnages peuvent avoir une silhouette similaire. Les cycles de marche sont simples (deux poses). Le positionnement bas-centre et les dimensions 128 × 256 sont conservés. Ne pas présenter ces poses comme un rig 3D ou une animation complète huit directions.
