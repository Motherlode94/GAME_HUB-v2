// config.js

// TAILLE DES TUILES ET CARTE
const TILE_SIZE = 40;
const MAP_COLS = 20;
const MAP_ROWS = 15;

// TAILLES DES ENTITÉS
const ENEMY_SIZE = 20;
const TOWER_SIZE = 30;
const PROJECTILE_SIZE = 5;

// GAMEPLAY
const STARTING_MONEY = 200;
const STARTING_LIVES = 20;
const TOWER_COST = 50;

// TYPES DE TUILES
const TILE_TYPES = {
    GRASS: 0,
    PATH: 1,
    BLOCKED: 2
};

// COULEURS
const COLORS = {
    GRASS:        "#2d5016",
    PATH:         "#8b7355",
    BLOCKED:      "#444",
    TOWER:        "#4169e1",
    TOWER_HOVER:  "#6495ed",
    TOWER_INVALID:"rgba(255,0,0,0.5)",
    ENEMY:        "#ff4444",
    PROJECTILE:   "#ffff00",
    RANGE:        "rgba(255,255,255,0.15)",
    UI_BG:        "rgba(0,0,0,0.7)",
    UI_TEXT:      "#fff",

    // Bonus : couleurs utiles pour le bouton vitesse
    SPEED_BUTTON: "#2a2a2a",
    SPEED_BORDER: "#888",
    SPEED_TEXT:   "#00ffff",
    SPEED_MAX:    "#ffcc00"     // couleur quand on est à ×4
};

// Export (optionnel – utile si tu passes à des modules plus tard)
if (typeof module !== 'undefined') {
    module.exports = {
        TILE_SIZE, MAP_COLS, MAP_ROWS,
        ENEMY_SIZE, TOWER_SIZE, PROJECTILE_SIZE,
        STARTING_MONEY, STARTING_LIVES, TOWER_COST,
        GAME_SPEED, SPEED_OPTIONS, speedIndex,
        TILE_TYPES, COLORS
    };
}