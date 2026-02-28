// GameIntegration.js - Exemple d'intégration du système de rendu

/**
 * GUIDE D'INTÉGRATION DU RENDER MANAGER
 * =====================================
 * 
 * 1. Initialiser dans votre Game.init() :
 */

// Dans Game.init()
Game.RenderManager.init();

/**
 * 2. Modifier votre boucle de rendu principale :
 */

// AVANT (méthode actuelle - problématique)
Game.render = function(ctx, canvas) {
  // Fond
  ctx.fillStyle = "#2d5016";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Tout est dessiné dans le désordre
  Game.Items.draw(ctx);
  Game.Buildings.draw(ctx);
  Game.Vehicles.draw(ctx);
  Game.Player.draw(ctx);
  Game.Enemies.draw(ctx);
  Game.HUD.draw(ctx);
};

// APRÈS (avec RenderManager - organisé)
Game.render = function(ctx, canvas) {
  const RM = Game.RenderManager;
  
  // 1. Fond (couche GROUND)
  RM.add(RM.layers.GROUND, (ctx) => {
    ctx.fillStyle = "#2d5016";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  // 2. Items au sol (couche ITEMS)
  if (Game.Items) {
    for (const item of Game.Items.items) {
      RM.add(RM.layers.ITEMS, (ctx) => {
        Game.Items.drawItem(ctx, item);
      }, item.y);
    }
  }

  // 3. Bâtiments (couche BUILDINGS)
  if (Game.Buildings) {
    for (const building of Game.Buildings.list) {
      RM.add(RM.layers.BUILDINGS, (ctx) => {
        Game.Buildings.drawBuilding(ctx, building);
      }, building.y + building.height); // Trier par le bas du bâtiment
    }
  }

  // 4. Véhicules (couche VEHICLES)
  if (Game.Vehicles) {
    for (const vehicle of Game.Vehicles.list) {
      RM.add(RM.layers.VEHICLES, (ctx) => {
        Game.Vehicles.drawVehicle(ctx, vehicle);
      }, vehicle.y);
    }
  }

  // 5. Joueur (couche CHARACTERS)
  if (Game.Player) {
    RM.add(RM.layers.CHARACTERS, (ctx) => {
      Game.Player.draw(ctx);
    }, Game.Player.y);
  }

  // 6. Ennemis (couche CHARACTERS)
  if (Game.Enemies) {
    for (const enemy of Game.Enemies.list) {
      RM.add(RM.layers.CHARACTERS, (ctx) => {
        Game.Enemies.drawEnemy(ctx, enemy);
      }, enemy.y);
    }
  }

  // 7. Effets visuels (couche EFFECTS)
  if (Game.Particles) {
    RM.add(RM.layers.EFFECTS, (ctx) => {
      Game.Particles.draw(ctx);
    });
  }

  // 8. Barres de vie dans le monde (couche UI_WORLD)
  if (Game.HUD && Game.HUD.drawHealthBars) {
    RM.add(RM.layers.UI_WORLD, (ctx) => {
      Game.HUD.drawHealthBars(ctx);
    });
  }

  // 9. HUD (couche UI_OVERLAY)
  if (Game.HUD) {
    RM.add(RM.layers.UI_OVERLAY, (ctx) => {
      Game.HUD.draw(ctx, canvas);
    });
  }

  // Rendre tout dans le bon ordre
  RM.render(ctx);
};

/**
 * 3. Adapter vos modules existants (optionnel mais recommandé)
 */

// Items.js - Séparer la logique de dessin
Game.Items = {
  items: [],
  
  draw(ctx) {
    // Option 1: Utiliser le RenderManager (intégré dans Game.render)
    // Rien à faire ici si déjà géré dans Game.render
    
    // Option 2: Dessiner directement (si pas de RenderManager)
    for (const item of this.items) {
      this.drawItem(ctx, item);
    }
  },
  
  drawItem(ctx, item) {
    // Ombre pour donner de la profondeur
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(item.x + item.size/2, item.y + item.size + 5, item.size/2, item.size/4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Item
    ctx.fillStyle = item.color || "#ffdd00";
    ctx.fillRect(item.x, item.y, item.size, item.size);
    
    // Icône/emoji
    if (item.icon) {
      ctx.font = `${item.size * 0.8}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.icon, item.x + item.size/2, item.y + item.size/2);
    }
  }
};

/**
 * 4. ASTUCE: Ajouter des ombres pour améliorer la lisibilité
 */

// Fonction utilitaire pour dessiner des ombres
Game.Utils = Game.Utils || {};

Game.Utils.drawShadow = function(ctx, x, y, width, height, opacity = 0.3) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  // Ombre elliptique au sol
  ctx.ellipse(
    x + width/2, 
    y + height + 5, 
    width/2, 
    height/4, 
    0, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
};

// Utilisation dans vos objets
Game.Player.draw = function(ctx) {
  // Dessiner l'ombre d'abord
  Game.Utils.drawShadow(ctx, this.x, this.y, this.size, this.size);
  
  // Puis le joueur
  ctx.fillStyle = "#00aaff";
  // ... reste du code
};

/**
 * 5. BONUS: Système de contour pour séparer visuellement les objets
 */

Game.Utils.drawWithOutline = function(ctx, drawFn, outlineColor = "#000000", outlineWidth = 2) {
  // Dessiner le contour
  ctx.save();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineWidth;
  ctx.lineJoin = "round";
  drawFn(ctx, true); // true = mode contour
  ctx.restore();
  
  // Dessiner le remplissage
  drawFn(ctx, false);
};

// Exemple d'utilisation
Game.Buildings.drawBuilding = function(ctx, building) {
  Game.Utils.drawWithOutline(ctx, (ctx, isOutline) => {
    if (isOutline) {
      ctx.strokeRect(building.x, building.y, building.width, building.height);
    } else {
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
    }
  }, "#000000", 3);
};

/**
 * 6. CONFIGURATION FINALE RECOMMANDÉE
 */

// Dans votre fichier principal (main.js ou index.js)
window.onload = function() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  
  // Initialiser le jeu
  Game.init();
  Game.RenderManager.init();
  
  // Boucle de jeu
  function gameLoop() {
    // Update
    Game.update();
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render avec système de couches
    Game.render(ctx, canvas);
    
    requestAnimationFrame(gameLoop);
  }
  
  gameLoop();
};