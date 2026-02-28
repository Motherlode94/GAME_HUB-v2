// speedGame.js

let GAME_SPEED = 1.0;
const SPEED_OPTIONS = [1, 2, 3, 4];
let speedIndex = 0;

function cycleGameSpeed() {
    speedIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    GAME_SPEED = SPEED_OPTIONS[speedIndex];
    console.log(`Vitesse de jeu : ×${GAME_SPEED}`);
}

// À appeler depuis handleCanvasClick quand on clique sur le bouton
