// config.js

// TAILLE DES TUILES ET CARTE
const TILE_SIZE = 40;
const MAP_COLS = 28;
const MAP_ROWS = 15;

// TAILLES DES ENTITÉS
const ENEMY_SIZE = 20;
const TOWER_SIZE = 30;
const PROJECTILE_SIZE = 5;

// GAMEPLAY
const STARTING_MONEY = 250;
const STARTING_LIVES = 20;
const MAX_TOWER_LEVEL = 5;
const SELL_REFUND = 0.7;            // part de l'argent investi rendue à la revente
const WAVE_COUNTDOWN_MS = 20000;    // délai avant lancement auto de la vague suivante
const EARLY_CALL_BONUS_PER_SEC = 2; // $ gagnés par seconde d'avance

// TYPES DE TUILES
const TILE_TYPES = {
    GRASS: 0,
    PATH: 1,
    BLOCKED: 2
};
