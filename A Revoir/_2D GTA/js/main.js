const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;
canvas.setAttribute("tabindex", "0");

Game.canvas = canvas;
Game.ctx = ctx;
Game.frameCount = 0;
Game.player = Game.Player;

Game.Runtime = {
  startedAt: Date.now(),
  lastSubmittedScore: 0,
  stats: {
    enemyKills: 0,
    npcKills: 0,
    copKills: 0,
    deaths: 0,
    runSeconds: 0,
    missionsCompleted: 0
  }
};

Game.registerKill = function(type) {
  if (!this.Runtime || !this.Runtime.stats) return;

  if (type === "enemy") this.Runtime.stats.enemyKills += 1;
  if (type === "npc") this.Runtime.stats.npcKills += 1;
  if (type === "cop") this.Runtime.stats.copKills += 1;
};

Game.registerDeath = function() {
  if (!this.Runtime || !this.Runtime.stats) return;
  this.Runtime.stats.deaths += 1;
};

Game.calculateScore = function() {
  const stats = (this.Runtime && this.Runtime.stats) || {};
  const money = (this.HUD && this.HUD.money) || 0;

  return Math.floor(
    money +
    (stats.enemyKills || 0) * 120 +
    (stats.copKills || 0) * 200 +
    (stats.npcKills || 0) * 40 +
    (stats.runSeconds || 0) * 5 +
    (stats.missionsCompleted || 0) * 700
  );
};

Game.submitRunScore = function(force = false) {
  const scoreValue = Math.floor((this.HUD && this.HUD.score) || 0);
  if (scoreValue <= 0) return false;

  if (!force && scoreValue <= (this.Runtime.lastSubmittedScore || 0)) {
    return false;
  }

  let submitted = false;

  if (window.CatalogScore && typeof window.CatalogScore.submit === "function") {
    submitted = !!window.CatalogScore.submit(scoreValue);
  } else if (typeof window.submitGameScore === "function") {
    submitted = !!window.submitGameScore("2d_gta", scoreValue);
  }

  if (submitted) {
    this.Runtime.lastSubmittedScore = Math.max(this.Runtime.lastSubmittedScore || 0, scoreValue);
  }

  return submitted;
};

Game.spawnInitialEnemies = function() {
  if (!Game.EnemyManager) return;

  const playerX = Game.player ? Game.player.x : Game.Map.width / 2;
  const playerY = Game.player ? Game.player.y : Game.Map.height / 2;
  let spawned = 0;
  let tries = 0;

  while (spawned < 4 && tries < 80) {
    tries += 1;
    const x = Utils.randomInt(300, Game.Map.width - 300);
    const y = Utils.randomInt(300, Game.Map.height - 300);
    const dist = Utils.distance(playerX, playerY, x, y);
    if (dist < 900) continue;

    Game.EnemyManager.spawn(x, y, spawned === 0 ? "tank" : spawned % 2 === 0 ? "fast" : "normal");
    spawned += 1;
  }
};

Game.resetGame = function(options = {}) {
  const config = {
    openMenu: false,
    submitScore: true,
    ...options
  };

  if (config.submitScore) {
    Game.submitRunScore(true);
  }

  if (Input.clear) Input.clear();

  Game.player = Game.Player;
  Game.player.x = Math.floor(Game.Map.width / 2);
  Game.player.y = Math.floor(Game.Map.height / 2);
  Game.player.angle = 0;
  Game.player.health = 100;
  Game.player.maxHealth = 100;
  Game.player.inVehicle = false;
  Game.player.currentVehicle = null;

  Game.Runtime.startedAt = Date.now();
  Game.Runtime.lastSubmittedScore = 0;
  Game.Runtime.stats = {
    enemyKills: 0,
    npcKills: 0,
    copKills: 0,
    deaths: 0,
    runSeconds: 0,
    missionsCompleted: 0
  };

  if (Game.Map && Game.Map.init) {
    Game.Map.init();
  }

  if (Game.Buildings) {
    Game.Buildings.list = [];
    Game.Buildings.init();
  }

  if (Game.Traffic && Game.Traffic.init) {
    Game.Traffic.init();
  }

  if (Game.VehicleManager && Game.VehicleManager.init) {
    Game.VehicleManager.init();
    Game.VehicleManager.playerVehicle = null;
  }

  if (Game.NPCManager) {
    if (Game.NPCManager.clear) Game.NPCManager.clear();
    if (Game.NPCManager.init) Game.NPCManager.init();
  }

  if (Game.EnemyManager) {
    if (Game.EnemyManager.clear) Game.EnemyManager.clear();
    Game.spawnInitialEnemies();
  }

  if (Game.WeaponManager) {
    if (Game.WeaponManager.reset) {
      Game.WeaponManager.reset();
    } else {
      Game.WeaponManager.init();
    }
  }

  if (Game.Shop) {
    Game.Shop.shops = [];
    Game.Shop.nearShop = null;
    Game.Shop.menuOpen = false;
    Game.Shop.init();
  }

  if (Game.Police && Game.Police.clear) {
    Game.Police.clear();
  }

  if (Game.Missions && Game.Missions.reset) {
    Game.Missions.reset();
  }

  if (Game.HUD) {
    if (Game.HUD.reset) {
      Game.HUD.reset();
    }
    Game.HUD.health = Game.player.health;
  }

  if (Game.Minimap) {
    Game.Minimap.y = null;
  }

  if (Game.Camera) {
    Game.Camera.x = 0;
    Game.Camera.y = 0;
    Game.Camera.targetX = 0;
    Game.Camera.targetY = 0;
    Game.Camera.shakeTimer = 0;
    Game.Camera.shakeIntensity = 0;
  } else {
    Game.camera = { x: 0, y: 0 };
  }

  if (Game.Menu) {
    if (config.openMenu) {
      Game.Menu.open("main");
    } else {
      Game.Menu.close();
    }
  }

  canvas.focus();
};

Game.update = function() {
  if (Game.Menu) {
    Game.Menu.update();
    if (Game.Menu.active) {
      if (Game.HUD) Game.HUD.update();
      Input.update();
      return;
    }
  }

  if (Game.Shop && Game.Shop.menuOpen) {
    Game.Shop.update();
    if (Game.HUD) Game.HUD.update();
    Input.update();
    return;
  }

  if (Game.Runtime && Game.Runtime.stats) {
    Game.Runtime.stats.runSeconds = Math.floor((Date.now() - Game.Runtime.startedAt) / 1000);
  }

  if (Game.player && Game.player.update) {
    Game.player.update();
  }

  if (Game.VehicleManager) {
    Game.VehicleManager.update();
  }

  if (Game.Buildings) {
    Game.Buildings.update();
  }

  if (Game.Traffic) {
    Game.Traffic.update();
  }

  if (Game.NPCManager) {
    Game.NPCManager.update();
  }

  if (Game.EnemyManager) {
    Game.EnemyManager.update();
  }

  if (Game.WeaponManager) {
    Game.WeaponManager.update();
  }

  if (Game.Police) {
    Game.Police.update();
  }

  if (Game.Shop) {
    Game.Shop.update();
  }

  if (Game.Missions) {
    Game.Missions.update();
  }

  if (!Game.player.inVehicle && Game.Collision && Game.Buildings) {
    Game.Collision.checkPlayerVsObstacles(Game.Buildings.list);
  }

  if (Game.HUD) {
    Game.HUD.update();
  }

  if (Game.Camera) {
    Game.Camera.update(canvas);
  } else {
    Game.camera.x = Game.player.x - canvas.width / 2;
    Game.camera.y = Game.player.y - canvas.height / 2;
    Game.camera.x = Math.max(0, Math.min(Game.Map.width - canvas.width, Game.camera.x));
    Game.camera.y = Math.max(0, Math.min(Game.Map.height - canvas.height, Game.camera.y));
  }

  if (Game.frameCount % 300 === 0) {
    Game.submitRunScore(false);
  }

  Input.update();
};

Game.draw = function() {
  if (Game.Camera) {
    Game.Camera.apply(ctx);
  } else {
    ctx.save();
    ctx.translate(-Game.camera.x, -Game.camera.y);
  }

  ctx.fillStyle = "#228822";
  ctx.fillRect(0, 0, Game.Map.width, Game.Map.height);

  ctx.fillStyle = "#333";
  ctx.fillRect(700, 0, 200, Game.Map.height);
  ctx.fillRect(0, 900, Game.Map.width, 200);

  if (Game.Buildings) Game.Buildings.draw(ctx);
  if (Game.Traffic) Game.Traffic.draw(ctx);
  if (Game.Shop) Game.Shop.draw(ctx);
  if (Game.VehicleManager) Game.VehicleManager.draw(ctx);
  if (Game.Police) Game.Police.draw(ctx);
  if (Game.NPCManager) Game.NPCManager.draw(ctx);
  if (Game.EnemyManager) Game.EnemyManager.draw(ctx);
  if (Game.WeaponManager) Game.WeaponManager.draw(ctx);
  if (Game.Missions) Game.Missions.drawWorld(ctx);

  if (Game.player && Game.player.draw) {
    Game.player.draw(ctx);
  }

  if (Game.Camera) {
    Game.Camera.restore(ctx);
  } else {
    ctx.restore();
  }

  if (Game.HUD) Game.HUD.draw(ctx, canvas);
  if (Game.Missions) Game.Missions.drawUI(ctx, canvas);
  if (Game.Minimap) Game.Minimap.draw(ctx, canvas);
  if (Game.WeaponManager) Game.WeaponManager.drawUI(ctx, canvas);
  if (Game.Shop) Game.Shop.drawUI(ctx, canvas);
  if (Game.Menu) Game.Menu.draw(ctx, canvas);
};

function gameLoop() {
  Game.frameCount += 1;
  Game.update();
  Game.draw();
  requestAnimationFrame(gameLoop);
}

Game.resetGame({ openMenu: true, submitScore: false });
gameLoop();
