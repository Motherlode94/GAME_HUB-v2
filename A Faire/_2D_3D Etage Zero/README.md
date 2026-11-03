# Étage Zéro — enquête 2D

Prototype jouable original WarLike Horror. Le nom du dossier est historique : ce projet est **2D**, pas une double version 2D/3D.

## Boucle jouable

1. Parcourir un étage top-down avec collisions et éclairage réduit.
2. Récupérer l'horloge, le portrait et la bande magnétique. L'ordre des chiffres est **4-1-7**.
3. Ouvrir le coffre d'archives au nord-est.
4. Atteindre l'escalier de sortie au nord-ouest.

Systèmes : vision spectrale à batterie, lampe, sprint/endurance, spectre hostile, refuge qui restaure les ressources, sauvegarde locale, reprise après échec, contrôles tactiles. Personnages et objets sont des fichiers SVG originaux dans `assets/`, pas des rectangles CSS.

**Contrôles :** ZQSD/WASD, E examiner, T vision spectrale, F lampe, J journal, K sauvegarde, Maj sprint, Échap pause.

**Limites :** IA simple, deux poses de marche, collisions sur tuiles ; le navigateur conserve les sauvegardes via localStorage. Jeu à garder dans `A Faire` tant que la QA graphique/mobile n'est pas effectuée.
