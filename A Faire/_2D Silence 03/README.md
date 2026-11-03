# SILENCE 03 — Les Voix du Mur

Survival-horror 2D original fondé sur le **bruit comme mécanisme de détection**.

## Boucle jouable

1. Explorer la maison à pas feutrés. Courir et marcher sur des plaques brisées font du bruit.
2. Éviter le Gardien aveugle : il utilise un parcours calculé sur la carte pour atteindre les sources sonores et peut voir à courte portée.
3. Se cacher dans une armoire ou lancer un caillou pour détourner sa recherche.
4. Récolter trois bandes : **2-6-9**. Entrer ce code au phonographe.
5. S'échapper par l'issue nord-ouest.

Le rendu 2D utilise les images SVG dans `assets/`. Le jeu mémorise sa progression dans localStorage.

**Contrôles :** ZQSD/WASD, Maj courir, Ctrl se déplacer discrètement, E examiner, Espace armoire, R caillou, J journal, K sauvegarde, Échap pause.

**Limites :** sons WebAudio synthétiques ; pas encore de voix enregistrées ni de véritables animations directionnelles. Les comportements doivent encore être testés sur mobile réel.
