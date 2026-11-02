// speedGame.js

let GAME_SPEED = 1;
const SPEED_OPTIONS = [1, 2, 3];
let speedIndex = 0;

function cycleGameSpeed() {
    speedIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    GAME_SPEED = SPEED_OPTIONS[speedIndex];
}

function resetGameSpeed() {
    speedIndex = 0;
    GAME_SPEED = SPEED_OPTIONS[0];
}
