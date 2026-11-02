# WarLike SpriteForge

Éditeur Web 2D autonome pour préparer les assets de **Super Hero: Rift City**. Les modifications n’affectent pas WarLike Engine ni les autres jeux.

## Travailler sur une planche de sprites composite

1. Charge la planche PNG dans l’éditeur.
2. Clique sur **Nouvelle sélection**, puis trace un rectangle autour d’une seule pose (ou dessine le contour avec le **Lasso libre**).
3. Clique sur **Isoler le personnage sélectionné**. Le travail de retouche s’effectue désormais sur une copie, et non sur la planche originale.
4. Avec **Fond 🪄**, clique sur le fond entourant le personnage, puis ajuste la **Tolérance**. Utilise la **Gomme** pour corriger les bords et **Ctrl+Z** en cas d’erreur.
5. Ajuste le cadrage, nomme la pose (par exemple `volt_run_01`) et clique sur **Ajouter le sprite**.
6. Clique sur **Retour à la planche d'origine** et répète pour les poses suivantes.
7. Clique sur **Lire** pour prévisualiser l’animation à la vitesse FPS choisie.
8. Clique sur **Exporter tous les sprites ZIP**. Le paquet contient :
   - `sprites/` : PNG individuels transparents ;
   - `animation/` : PNG ramenés aux mêmes dimensions, alignés bas-centre ;
   - `annotations/` : annotations PNG pour chaque sprite ;
   - `manifest.json` : dimensions, FPS et coordonnées d’extraction.

La planche d’origine reste intacte dans le navigateur. Les PNG restent à vérifier individuellement avant de les mettre dans le jeu.

## Raccourcis

| Touche | Fonction |
| --- | --- |
| R | Cadrage rectangulaire |
| L | Lasso libre |
| B | Crayon |
| E | Gomme |
| M | Suppression du fond |
| H | Déplacer la vue |
| F | Ajuster l'image |
| Ctrl + Z | Annuler |
| Alt + glisser | Nouveau rectangle sans déplacer l'ancien |
| Molette | Zoom autour de la souris |

## Limites

Les planches illustrées avec des textes et un fond opaque ne sont **pas** des spritesheets transparentes prêtes à utiliser. L'outil de suppression de fond ne traite que la région contiguë de couleur proche de celle cliquée. Les détails confondus avec le fond exigent une correction manuelle.

L’export « manifeste JSON » contient des métadonnées : pour sauvegarder les pixels des sprites, utilise **Exporter tous les sprites ZIP**. La prévisualisation aligne les frames au bas-centre ; un pivot personnalisé n'est pas encore disponible.

## Structure

- `index.html` : interface
- `styles/editor.css` : mise en page et responsive
- `scripts/editor.js` : moteur d’édition 2D
- `scripts/asset-loader.js` : démonstrations SVG
- `assets/heroes/`, `assets/enemies/`, `assets/vfx/` : assets d’exemple, distincts des PNG de la Partie 2

L’éditeur traite les PNG sélectionnés localement dans le navigateur. Pour le panneau « Assets fournis » en local, utiliser un serveur HTTP local ou l’hébergement Cloudflare ; l’import de fichiers via le sélecteur fonctionne sans réseau.
