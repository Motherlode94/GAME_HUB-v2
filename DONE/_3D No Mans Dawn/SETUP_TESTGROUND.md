# No Man's Dawn — prototype TestGround (Unity 6)

## Setup dans Unity 6 URP
1. Créer un projet **Universal 3D** et copier `Assets/_WarLike` dans ses Assets.
2. Créer une scène `TestGround` avec un **Terrain** ou un sol muni d'un collider.
3. Importer **un vrai modèle humanoïde riggé**, configurer Rig = Humanoid, Avatar et un Animator Controller.
4. Créer un GameObject `Player` (position Y au-dessus du sol) avec **CharacterController** et **SurvivorMotor**; placer le modèle 3D en enfant avec son Animator. CharacterController conseillé : radius 0.3, height 1.8, center (0,0.9,0).
5. Sur la caméra principale, ajouter **SurvivorCamera**, affecter Player comme Target et régler Obstruction Mask pour **exclure la couche du joueur**.
6. Affecter la caméra au champ Camera Pivot du SurvivorMotor; exclure également la couche Player du masque Overhead Obstacles pour pouvoir se relever.
7. Créer dans le contrôleur Animator les paramètres **Speed (float)**, **Grounded (bool)** et **Crouched (bool)**. Associer les clips compatibles avec votre personnage. Ce code ne fournit PAS de modèles ni d'animations.
8. Si nécessaire, **Project Settings > Player > Active Input Handling = Both** (les scripts utilisent Input Manager classique).
9. Sauvegarder la scène `Assets/_WarLike/Scenes/TestGround.unity`, tester, puis corriger références et couches.

## Contrôles
ZQSD/WASD (axes Horizontal/Vertical), Maj gauche : courir, C : s'accroupir/relever, Espace : sauter, clic droit : verrouiller la caméra, Échap : libérer la souris.

## Limites
Scripts livrés non compilés dans l'éditeur Unity ; la scène, l'Animator Controller et les modèles doivent être importés/configurés dans Unity. L'orientation de la caméra est libre et n'ajoute pas de visée/épaule avancée. Ne pas annoncer le prototype comme jouable sans essais dans Unity.
