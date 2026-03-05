// js/core/Game.js - Objet Game global
const Game = {
  // Core
  player: null,
  camera: null,
  
  // Systèmes
  entities: {},
  systems: {},
  world: {},
  ui: {},
  
  // Modules (seront définis par les autres fichiers)
  Map: null,
  Buildings: null,
  Traffic: null,
  VehicleManager: null,
  NPCManager: null,
  EnemyManager: null,
  Collision: null,
  Physics: null,
  Camera: null,
  AI: null,
  HUD: null,
  Minimap: null,
  Menu: null,
  
  // Méthodes principales (seront définies dans main.js)
  update: null,
  draw: null,
  loop: null
};