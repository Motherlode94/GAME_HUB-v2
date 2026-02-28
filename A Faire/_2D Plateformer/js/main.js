import { Game } from './game.js';

const game = new Game("gameCanvas");
game.start().catch(err => console.error("Game failed to start:", err));