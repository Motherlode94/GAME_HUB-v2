# WarLike Civilian Pack · v1.0

Pack original de 24 personnages adultes fictifs en **vrais fichiers images SVG** (fonds transparents, tailles normalisées), utilisables dans les jeux de `DONE`.

Chaque civil dispose de **4 illustrations autonomes** : `portraits/<id>.svg`, `sprites/<id>_idle.svg`, `sprites/<id>_walk_01.svg`, `sprites/<id>_walk_02.svg`.
Les sprites complets utilisent un canevas 128×256, avec ancrage au bas-centre. Les portraits utilisent une vue cadrée du même dessin. Pas de formes CSS en guise d'images.

Les SVG sont des images 2D vectorielles, **pas des PNG**. Les jeux les chargent directement avec `<img>`. Pour obtenir des PNG, importe le SVG dans SpriteForge et exporte des PNG transparents, ou rasterise à la résolution désirée. Les deux images de marche alternent mais ne sont pas encore des animations de 8 directions ni un système de rigging.

`manifest.json` liste les personnages et les chemins. Ouvrir `index.html` depuis Cloudflare Pages ou un serveur HTTP local pour voir la galerie.
