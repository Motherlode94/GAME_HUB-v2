/* Jeu de tir 2D – Canvas pur (Version améliorée)
   Contrôles: ← → pour bouger, Espace pour tirer, P pour pause.
   Mobile: boutons pad.
*/

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // HUD
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const btnStart = document.getElementById("btnStart");

  // Menus
  const mainMenu = document.getElementById("mainMenu");
  const levelMenu = document.getElementById("levelMenu");
  const btnPlay = document.getElementById("btnPlay");
  const btnLevels = document.getElementById("btnLevels");
  const btnBackToMenu = document.getElementById("btnBackToMenu");
  const levelButtons = document.querySelectorAll(".lvl-btn");

  // Mobile pad
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const fireBtn = document.getElementById("fireBtn");

  // ------- Utils -------
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const randRange = (min, max) => Math.random() * (max - min) + min;
  const now = () => performance.now();

  // ------- Configuration du jeu -------
  const CONFIG = {
    PLAYER: {
      WIDTH: 50,
      HEIGHT: 24,
      SPEED: 380,
      FIRE_RATE: 0.18,
      COLOR: "#4ac8ff",
      START_Y_OFFSET: 70
    },
    BULLET: {
      WIDTH: 6,
      HEIGHT: 16,
      SPEED: -600,
      COLOR: "#ffe066"
    },
ENEMY: {
  MIN_WIDTH: 36,
  MAX_WIDTH: 62,
  MIN_HEIGHT: 22,
  MAX_HEIGHT: 34,
  BASE_SPEED: 45,
  SPEED_VARIANCE: { MIN: 10, MAX: 55 },
  LATERAL_SPEED_RANGE: { MIN: -40, MAX: 40 },
  NORMAL_HP: 1,
  TOUGH_HP: 2,
  TOUGH_CHANCE: 0.2,
  COLOR_NORMAL: "#9ef19e",
  COLOR_TOUGH: "#ff5a7a",
  BEHAVIORS: {
    WIGGLE: { fireChance: 0, lateralSpeed: 40 },
    DIVE: { fireChance: 0.1, lateralSpeed: 0 },
    ZIGZAG: { fireChance: 0.05, lateralSpeed: 80 },
    V_FORMATION: { fireChanche: 0, lateralSpeed: 0 }
  }
},
    BOSS: {
      WIDTH: 120,
      HEIGHT: 80,
      HP: 30,
      SPEED: 60,
      COLOR: "#ff3366",
      FIRE_RATE: 0.5,
      SCORE_VALUE: 500
    },
    SPAWN: {
      INITIAL_INTERVAL: 0.9,
      MIN_INTERVAL: 0.35,
      INTERVAL_DECREASE: 0.01,
      SPEED_INCREASE: 0.5,
      WAVE_MIN: 2,
      WAVE_MAX: 5
    },
	POWERUP: {
      WIDTH: 20,
      HEIGHT: 20,
      DROP_CHANCE: 0.1, // 10% de chance qu'un ennemi lâche un power-up
      SPEED: 150,
      TYPES: {
        TRIPLE_SHOT: { color: "#ffc107", duration: 8, effect: 'TRIPLE_SHOT' },
        SHIELD: { color: "#4ac8ff", duration: 10, effect: 'SHIELD' },
        LIFE: { color: "#28a745", duration: 0, effect: 'LIFE' }
      }
    },
    LEVELS: {
      1: { spawnInterval: 0.9, enemySpeed: 45, bossThreshold: 300 },
      2: { spawnInterval: 0.7, enemySpeed: 75, bossThreshold: 500 },
      3: { spawnInterval: 0.6, enemySpeed: 95, bossThreshold: 700 }
    },
    WORLD: {
      MAX_DELTA: 0.033, // Cap à ~30 FPS
      MARGIN: 8,
      SCORE_PER_ENEMY: 10
    }
  };

  // ------- État du jeu -------
  const WORLD = {
    w: canvas.width,
    h: canvas.height,
    running: false,
    paused: false,
    lastTime: 0,
    dt: 0,
    score: 0,
    lives: 3,
    level: 1,
    bossActive: false,
    bossSpawned: false,
    gameState: 'MENU', // MENU, PLAYING, PAUSED, GAMEOVER
    // Variables de spawn intégrées dans WORLD
    spawnTimer: 0,
    spawnInterval: CONFIG.SPAWN.INITIAL_INTERVAL,
    enemySpeedBase: CONFIG.ENEMY.BASE_SPEED,
  };

  // ------- Joueur -------
  const player = {
    w: CONFIG.PLAYER.WIDTH,
    h: CONFIG.PLAYER.HEIGHT,
    x: 0,
    y: 0,
    speed: CONFIG.PLAYER.SPEED,
    color: CONFIG.PLAYER.COLOR,
    fireCooldown: 0,
    fireRate: CONFIG.PLAYER.FIRE_RATE,
	activeEffects: {
      TRIPLE_SHOT: 0, // Compteur de temps restant (en secondes)
      SHIELD: 0,
    },
    moveLeft: false, // Contrôlé uniquement par le pad mobile
    moveRight: false, // Contrôlé uniquement par le pad mobile
    invulnerable: false,
    invulnerableTimer: 0
  };

  // ------- Projectiles -------
  const bullets = [];
  const enemyBullets = [];
  const powerups = [];

  // ------- Ennemis -------
  const enemies = [];
  let boss = null;
  
  // ------- Particules (effets visuels) -------
  const particles = [];

  // ------- Entrées clavier -------
  const keys = {};
  
  const handleKeyDown = (e) => {
    // Empêche le défilement de la page ou l'action par défaut du navigateur
    if (["ArrowLeft", "ArrowRight", " ", "Space", "KeyP"].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;
    if (e.code === "KeyP" && WORLD.gameState === 'PLAYING') {
      togglePause();
    }
  };

  const handleKeyUp = (e) => {
    keys[e.code] = false;
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // ------- Pad mobile -------
  const setPadHold = (btn, moveDirection) => {
    const down = (ev) => { 
      ev.preventDefault(); 
      player[moveDirection] = true; 
    };
    const up = (ev) => { 
      ev.preventDefault(); 
      player[moveDirection] = false; 
    };
    btn.addEventListener("touchstart", down, {passive:false});
    btn.addEventListener("mousedown", down);
    ["touchend","touchcancel","mouseup","mouseleave"].forEach(evt => 
      btn.addEventListener(evt, up)
    );
  };

  setPadHold(leftBtn, 'moveLeft');
  setPadHold(rightBtn, 'moveRight');
  
  fireBtn.addEventListener("touchstart", (e) => { 
    e.preventDefault(); 
    tryShoot(); 
  }, {passive:false});
  fireBtn.addEventListener("click", tryShoot);

  // ------- Gestion des menus -------
  const showMenu = (menu) => {
    mainMenu.style.display = 'none';
    levelMenu.style.display = 'none';
    if (menu === 'main') mainMenu.style.display = 'flex';
    if (menu === 'level') levelMenu.style.display = 'flex';
  };

  const hideAllMenus = () => {
    mainMenu.style.display = 'none';
    levelMenu.style.display = 'none';
  };

  btnPlay.addEventListener("click", () => {
    hideAllMenus();
    startGame(1);
  });

  btnLevels.addEventListener("click", () => {
    showMenu('level');
  });

  btnBackToMenu.addEventListener("click", () => {
    showMenu('main');
  });

  levelButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const level = parseInt(e.target.dataset.level);
      hideAllMenus();
      startGame(level);
    });
  });

  // ------- Fonctions de jeu -------
  function resetPlayer() {
    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - CONFIG.PLAYER.START_Y_OFFSET;
    player.fireCooldown = 0;
    player.invulnerable = false;
    player.invulnerableTimer = 0;
    player.moveLeft = false;
    player.moveRight = false;
  }

  function applyLevelSettings(level) {
    const settings = CONFIG.LEVELS[level] || CONFIG.LEVELS[1];
    WORLD.spawnInterval = settings.spawnInterval;
    WORLD.enemySpeedBase = settings.enemySpeed;
    WORLD.level = level;
    WORLD.bossSpawned = false;
    WORLD.bossActive = false;
  }

function startGame(level = 1) {
  // Réinitialiser TOUTES les variables
  WORLD.running = true;
  WORLD.paused = false;
  WORLD.gameState = 'PLAYING';
  WORLD.score = 0;
  WORLD.lives = 3;
  WORLD.frameCount = 0;
  
  // VIDER PROPRETEMENT tous les tableaux
  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  powerups.length = 0;
  boss = null;
  
  // Réinitialiser le joueur
  player.activeEffects = { TRIPLE_SHOT: 0, SHIELD: 0 };
  player.invulnerable = false;
  player.invulnerableTimer = 0;
  
  applyLevelSettings(level);
  resetPlayer();
  
  updateHUD();
  
  // Redémarrer la boucle
  WORLD.lastTime = performance.now();
  requestAnimationFrame(loop);
}

  function togglePause() {
    if (!WORLD.running || WORLD.gameState !== 'PLAYING') return;
    WORLD.paused = !WORLD.paused;
    WORLD.gameState = WORLD.paused ? 'PAUSED' : 'PLAYING';
    btnStart.textContent = WORLD.paused ? "⏸️ En pause" : "▶ Recommencer";
    
    // Pour que la boucle reprenne correctement si on était en pause
    if (!WORLD.paused) {
      WORLD.lastTime = now();
      requestAnimationFrame(loop);
    }
  }

  function gameOver() {
    WORLD.running = false;
    WORLD.gameState = 'GAMEOVER';
    draw();
    showGameOver();
  }

  function showGameOver() {
    ctx.save();
    ctx.fillStyle = "rgba(10,10,20,.85)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 44px system-ui";
    ctx.fillText("GAME OVER", WORLD.w/2, WORLD.h/2 - 30);

    ctx.font = "28px system-ui";
    ctx.fillStyle = "#4ac8ff";
    ctx.fillText(`Score : ${WORLD.score}`, WORLD.w/2, WORLD.h/2 + 20);
    
    ctx.font = "18px system-ui";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(`Niveau ${WORLD.level}`, WORLD.w/2, WORLD.h/2 + 50);
    ctx.fillText(`Cliquez "Recommencer" pour rejouer`, WORLD.w/2, WORLD.h/2 + 80);
    ctx.restore();
  }

  function updateHUD() {
    scoreEl.textContent = WORLD.score;
    livesEl.textContent = WORLD.lives;
  }

  // ------- Boucle principale -------
function loop(ts) {
  if (!WORLD.running) return;
  
  // Protection contre les boucles trop rapides
  if (!ts || ts < WORLD.lastTime) {
    WORLD.lastTime = performance.now();
    requestAnimationFrame(loop);
    return;
  }
  
  const dt = Math.min((ts - WORLD.lastTime) / 1000, CONFIG.WORLD.MAX_DELTA);
  
  // Si le jeu est bloqué (dt trop grand), on le réinitialise
  if (dt > 1.0) {
    console.warn("Jeu bloqué détecté, réinitialisation du delta");
    WORLD.lastTime = ts;
    requestAnimationFrame(loop);
    return;
  }
  
  WORLD.lastTime = ts;
  WORLD.dt = dt;
  
  if (!WORLD.paused && WORLD.gameState === 'PLAYING') {
    update(dt);
    draw();
  }
  
  // Limiter le framerate si nécessaire
  setTimeout(() => {
    requestAnimationFrame(loop);
  }, 16); // ~60 FPS
}
  function enemyFire(enemy) {
  // Tir simple vers le bas
  enemyBullets.push({
    x: enemy.x + enemy.w / 2 - 3,
    y: enemy.y + enemy.h,
    w: 6,
    h: 12,
    speed: 200,
    color: "#ff5a7a",
    alive: true
  });
}

  // ------- Update -------
  function update(dt) {
    // Invulnérabilité
    if (player.invulnerable) {
      player.invulnerableTimer -= dt;
      if (player.invulnerableTimer <= 0) {
        player.invulnerable = false;
      }
    }

    // Entrées (Clavier ET Mobile)
    const movingLeft = keys["ArrowLeft"] || player.moveLeft;
    const movingRight = keys["ArrowRight"] || player.moveRight;

    let vx = 0;
    if (movingLeft && !movingRight) vx = -player.speed;
    if (movingRight && !movingLeft) vx = player.speed;

    player.x = clamp(
      player.x + vx * dt, 
      CONFIG.WORLD.MARGIN, 
      WORLD.w - player.w - CONFIG.WORLD.MARGIN
    );
	
	// Gérer la durée des effets du joueur
    updatePlayerEffects(dt);

    // Tir
    player.fireCooldown -= dt;
    if (keys["Space"]) tryShoot();

    // Projectiles joueur
    updateBullets(dt);

    // Projectiles ennemis
    updateEnemyBullets(dt);
	
	// Power-ups
    updatePowerups(dt);

    // Particules
    updateParticles(dt);

    // Boss
    if (boss) {
      updateBoss(dt);
    } else {
      // Spawn normal
      updateEnemySpawn(dt);
    }

    // Ennemis
    updateEnemies(dt);

    // Collisions
    checkCollisions();

    // Vérifier spawn du boss
    checkBossSpawn();
  }
 
function updateBullets(dt) {
  // VERSION CORRIGÉE
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += b.speed * dt;
    
    // Supprimer si hors écran OU si non vivant
    if (b.y <= -b.h || b.y >= WORLD.h || !b.alive) {
      bullets.splice(i, 1);
    }
  }
  
  // Limite absolue
  if (bullets.length > 200) {
    bullets.splice(0, bullets.length - 200);
  }
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.y += b.speed * dt;
    
    if (b.y >= WORLD.h || !b.alive) {
      enemyBullets.splice(i, 1);
    }
  }
  
  if (enemyBullets.length > 100) {
    enemyBullets.splice(0, enemyBullets.length - 100);
  }
}

function updateParticles(dt) {
  const newParticles = [];
  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.alpha = p.life / p.maxLife;
    if (p.life > 0) {
      newParticles.push(p);
    }
  }
  // 🔥 Limite à 500 particules max
  particles.length = 0;
  particles.push(...newParticles.slice(-500));
}
  
  function updatePowerups(dt) {
    const newPowerups = [];
    for (const p of powerups) {
      p.y += CONFIG.POWERUP.SPEED * dt;
      if (p.y < WORLD.h && p.alive) {
        newPowerups.push(p);
      } else {
        // Particule de disparition
        if (p.y >= WORLD.h) createExplosion(p.x, p.y, p.color, 3);
      }
    }
    powerups.length = 0;
    powerups.push(...newPowerups);
  }

  function updatePlayerEffects(dt) {
    for (const key in player.activeEffects) {
      if (player.activeEffects[key] > 0) {
        player.activeEffects[key] -= dt;
        if (player.activeEffects[key] < 0) {
          player.activeEffects[key] = 0; // Fin de l'effet
          // Logique de fin d'effet spécifique si nécessaire (ici, pas besoin)
        }
      }
    }
  }

function updateEnemySpawn(dt) {
  WORLD.spawnTimer += dt;
  if (WORLD.spawnTimer >= WORLD.spawnInterval) {
    WORLD.spawnTimer = 0;
    spawnEnemyWave();
    
    // Plafonner la difficulté
    if (WORLD.spawnInterval > CONFIG.SPAWN.MIN_INTERVAL) {
      WORLD.spawnInterval -= CONFIG.SPAWN.INTERVAL_DECREASE;
    }
    // ⚠️ Ne JAMAIS dépasser une vitesse raisonnable
    if (WORLD.enemySpeedBase < 200) { // par exemple
      WORLD.enemySpeedBase += CONFIG.SPAWN.SPEED_INCREASE;
    }
  }
}

function updateEnemies(dt) {
  const newEnemies = [];
  for (const e of enemies) {
    // ====== COMPORTERMENTS ======
    if (e.behavior === 'WIGGLE') {
      e.x += e.speedX || randRange(-40, 40) * dt;
      if (e.x < CONFIG.WORLD.MARGIN || e.x + e.w > WORLD.w - CONFIG.WORLD.MARGIN) {
        e.speedX = -(e.speedX || 0);
      }
    }
    
    else if (e.behavior === 'DIVE') {
      if (!e.diveActivated && e.y > 100) {
        e.diveActivated = true;
        e.speedY += 200;
      }
    }
    
    else if (e.behavior === 'ZIGZAG') {
      e.zigzagPhase += dt * Math.PI * 2 / 1.2;
      e.x = e.baseX + Math.sin(e.zigzagPhase) * 100;
      e.x = clamp(e.x, CONFIG.WORLD.MARGIN, WORLD.w - e.w - CONFIG.WORLD.MARGIN);
    }
    
    else if (e.behavior === 'V_FORMATION') {
      const targetX = WORLD.w / 2 + e.formationOffset * (1 - Math.min(1, e.y / 300));
      e.x += (targetX - e.x) * 0.05;
    }

    // Mouvement vertical
    e.y += e.speedY * dt;

    // ====== TIR ======
    if (e.fireRate > 0) {
      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0) {
        enemyFire(e);
        e.fireCooldown = e.fireRate;
      }
    }

    // ====== NETTOYAGE HORS ÉCRAN + ZONE DE DANGER ======
    if (e.y > WORLD.h + 100 || e.y + e.h < -100) {
      // Hors écran → suppression silencieuse
      e.alive = false;
    } else if (e.y + e.h >= WORLD.h - CONFIG.WORLD.MARGIN) {
      // Zone de danger → explosion + perte de vie
      createExplosion(e.x + e.w/2, e.y + e.h/2, e.color);
      loseLife();
      e.alive = false;
    }

    if (e.alive) newEnemies.push(e);
  }
  enemies.length = 0;
  enemies.push(...newEnemies);
}

  function updateBoss(dt) {
    if (!boss || !boss.alive) return;

    // Mouvement du boss
    boss.x += boss.speedX * dt;
    boss.fireCooldown -= dt;

    // Rebond
    if (boss.x < CONFIG.WORLD.MARGIN || boss.x + boss.w > WORLD.w - CONFIG.WORLD.MARGIN) {
      boss.speedX *= -1;
    }

    // Tir du boss
    boss.fireCooldown -= dt;
    if (boss.fireCooldown <= 0) {
      bossFire();
      boss.fireCooldown = CONFIG.BOSS.FIRE_RATE;
    }
  }

  function checkBossSpawn() {
    const settings = CONFIG.LEVELS[WORLD.level] || CONFIG.LEVELS[1];
    if (!WORLD.bossSpawned && WORLD.score >= settings.bossThreshold && !boss) {
      spawnBoss();
      WORLD.bossSpawned = true;
    }
  }

function checkCollisions() {
  // IMPORTANT: Toujours parcourir les tableaux de la fin vers le début
  // lorsqu'on supprime des éléments
  
  // 1. Balles joueur vs ennemis
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e || !e.alive) continue;
    
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (!b || !b.alive) continue;
      
      if (rectsIntersect(e, b)) {
        e.hp -= 1;
        b.alive = false;
        
        if (e.hp <= 0) {
          createExplosion(e.x + e.w/2, e.y + e.h/2, e.color);
          enemies.splice(i, 1); // Supprime immédiatement
          WORLD.score += CONFIG.WORLD.SCORE_PER_ENEMY;
          
          if (Math.random() < CONFIG.POWERUP.DROP_CHANCE) {
            dropPowerup(e.x + e.w/2, e.y + e.h/2);
          }
          updateHUD();
        }
        bullets.splice(j, 1); // Supprime la balle touchée
        break; // Sortir de la boucle des balles pour cet ennemi
      }
    }
  }
  
  // 2. Balles joueur vs boss
  if (boss && boss.alive) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (!b || !b.alive) continue;
      
      if (rectsIntersect(boss, b)) {
        boss.hp -= 1;
        bullets.splice(j, 1);
        createHitEffect(b.x, b.y);
        
        if (boss.hp <= 0) {
          createExplosion(boss.x + boss.w/2, boss.y + boss.h/2, boss.color, 30);
          boss = null;
          WORLD.score += CONFIG.BOSS.SCORE_VALUE;
          WORLD.bossActive = false;
          updateHUD();
        }
      }
    }
  }
  
  // 3. Collision joueur-ennemi
  if (!player.invulnerable) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e || !e.alive) continue;
      
      if (rectsIntersect(e, player)) {
        createExplosion(e.x + e.w/2, e.y + e.h/2, e.color);
        enemies.splice(i, 1);
        loseLife();
        makePlayerInvulnerable();
        break; // Une collision à la fois
      }
    }
  }
  
  // 4. Balles ennemies vs joueur
  if (!player.invulnerable) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      if (!b || !b.alive) continue;
      
      if (rectsIntersect(b, player)) {
        enemyBullets.splice(i, 1);
        loseLife();
        makePlayerInvulnerable();
        break;
      }
    }
  }
  
  // 5. Power-ups vs joueur
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (!p || !p.alive) continue;
    
    if (rectsIntersect(p, player)) {
      applyPowerupEffect(p.type);
      createExplosion(p.x, p.y, p.color, 5);
      powerups.splice(i, 1);
    }
  }
}

function destroyBoss() {
  if (!boss) return;
  createExplosion(boss.x + boss.w/2, boss.y + boss.h/2, boss.color, 30);
  WORLD.score += CONFIG.BOSS.SCORE_VALUE;
  WORLD.bossActive = false;
  boss = null;
  updateHUD();
}

function dropPowerup(x, y) {
    // Choisir un type aléatoire
    const types = Object.keys(CONFIG.POWERUP.TYPES);
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const typeConfig = CONFIG.POWERUP.TYPES[typeKey];

    powerups.push({
      x: x - CONFIG.POWERUP.WIDTH / 2,
      y: y - CONFIG.POWERUP.HEIGHT / 2,
      w: CONFIG.POWERUP.WIDTH,
      h: CONFIG.POWERUP.HEIGHT,
      color: typeConfig.color,
      type: typeKey,
      alive: true,
    });
  }
function applyPowerupEffect(type) {
    const config = CONFIG.POWERUP.TYPES[type];
    if (!config) return;

    switch (config.effect) {
      case 'TRIPLE_SHOT':
        // Ajoute la durée ou la réinitialise si déjà actif
        player.activeEffects.TRIPLE_SHOT = config.duration;
        break;
      case 'SHIELD':
        // Le bouclier est similaire à l'invulnérabilité mais lié au power-up
        player.activeEffects.SHIELD = config.duration;
        // L'invulnérabilité gère les collisions, nous la basculons pour le bouclier
        player.invulnerable = true;
        player.invulnerableTimer = config.duration + WORLD.dt; // Maintient l'effet pour la durée
        break;
      case 'LIFE':
        WORLD.lives = Math.min(WORLD.lives + 1, 5); // Cap à 5 vies
        updateHUD();
        break;
    }
  }
  function loseLife() {
    WORLD.lives -= 1;
    updateHUD();
    if (WORLD.lives <= 0) {
      gameOver();
    }
  }

  function makePlayerInvulnerable() {
    player.invulnerable = true;
    player.invulnerableTimer = 2; // 2 secondes
  }

  // ------- Dessin -------
  function draw() {
    ctx.clearRect(0, 0, WORLD.w, WORLD.h);
    drawBackground();
    drawParticles();
    
    // Joueur avec effet de clignotement si invulnérable
    if (!player.invulnerable || Math.floor(player.invulnerableTimer * 10) % 2 === 0) {
      drawPlayer(player);
    }
    
    bullets.forEach(drawBullet);
    enemyBullets.forEach(drawEnemyBullet);
    enemies.forEach(drawEnemy);
	powerups.forEach(drawPowerup);
	
    
    if (boss && boss.alive) {
      drawBoss(boss);
    }

    // HUD en jeu
    drawGameHUD();
  }

  function drawBackground() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    // Rendre l'effet visuel plus dynamique sans affecter les performances
    const offset = Date.now() / 1000 % 1000;
    for (let i = 0; i < 50; i++) {
      const x = ((i * 97) + offset) % WORLD.w;
      const y = ((i * 53) + offset/2) % WORLD.h;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : "rgba(74,200,255,.06)";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  function drawPlayer(p) {
    ctx.save();
    ctx.fillStyle = p.color;
    roundRect(ctx, p.x, p.y, p.w, p.h, 6, true);
    
    ctx.fillStyle = "#a9e6ff";
    ctx.fillRect(p.x + p.w/2 - 4, p.y - 10, 8, 10);
    
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#4ac8ff";
    roundRect(ctx, p.x-4, p.y-2, p.w+8, p.h+6, 8, true);
    ctx.restore();
  }

  function drawBullet(b) {
    ctx.save();
    ctx.fillStyle = b.color;
    roundRect(ctx, b.x, b.y, b.w, b.h, 3, true);
    
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#fff";
    roundRect(ctx, b.x, b.y, b.w, b.h/2, 3, true);
    ctx.restore();
  }

  function drawEnemyBullet(b) {
    ctx.save();
    ctx.fillStyle = "#ff5a7a";
    roundRect(ctx, b.x, b.y, b.w, b.h, 2, true);
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.fillStyle = e.color;
    roundRect(ctx, e.x, e.y, e.w, e.h, 6, true);
    
    ctx.fillStyle = "#fff2";
    ctx.fillRect(e.x+6, e.y+4, e.w-12, 4);
    
    // Barre de vie pour ennemis costauds
    if (e.maxHp > 1) {
      const hpPercent = e.hp / e.maxHp;
      ctx.fillStyle = "#333";
      ctx.fillRect(e.x, e.y - 8, e.w, 4);
      ctx.fillStyle = hpPercent > 0.5 ? "#4ac8ff" : "#ff5a7a";
      ctx.fillRect(e.x, e.y - 8, e.w * hpPercent, 4);
    }
    ctx.restore();
  }

  function drawBoss(b) {
    ctx.save();
    
    // Corps principal
    ctx.fillStyle = b.color;
    roundRect(ctx, b.x, b.y, b.w, b.h, 10, true);
    
    // Détails
    ctx.fillStyle = "#ff6688";
    roundRect(ctx, b.x + 10, b.y + 10, b.w - 20, 15, 4, true);
    ctx.fillRect(b.x + b.w/2 - 5, b.y + b.h - 10, 10, 10);
    
    // Barre de vie du boss
    const hpPercent = b.hp / b.maxHp;
    const barW = b.w;
    const barH = 8;
    const barX = b.x;
    const barY = b.y - 15;
    
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barW, barH);
    
    ctx.fillStyle = hpPercent > 0.5 ? "#4ac8ff" : hpPercent > 0.25 ? "#ffa500" : "#ff3366";
    ctx.fillRect(barX, barY, barW * hpPercent, barH);
    
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);
    
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      // Utiliser des cercles ou des formes plus douces pour les explosions
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawGameHUD() {
    if (!boss || !boss.alive) return;
    
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("⚠️ BOSS ⚠️", WORLD.w/2, 30);
    ctx.restore();
  }

  // ------- Tir -------
function tryShoot() {
    if (player.fireCooldown > 0 || WORLD.paused || !WORLD.running) return;

    // Réduit le temps de recharge pour les tirs puissants (sinon, c'est trop lent)
    const fireRateMultiplier = player.activeEffects.TRIPLE_SHOT > 0 ? 0.75 : 1;
    player.fireCooldown = player.fireRate * fireRateMultiplier;

    // Configuration du tir simple
    const baseShot = {
      w: CONFIG.BULLET.WIDTH,
      h: CONFIG.BULLET.HEIGHT,
      speed: CONFIG.BULLET.SPEED,
      color: CONFIG.BULLET.COLOR,
      alive: true,
    };

    const shots = [];
    
    if (player.activeEffects.TRIPLE_SHOT > 0) {
      // Triple tir : Centre
      shots.push({
        ...baseShot,
        x: player.x + player.w/2 - baseShot.w/2,
        y: player.y - baseShot.h,
      });
      // Triple tir : Gauche
      shots.push({
        ...baseShot,
        x: player.x + player.w/4 - baseShot.w/2,
        y: player.y - baseShot.h/2,
      });
      // Triple tir : Droite
      shots.push({
        ...baseShot,
        x: player.x + player.w * 3/4 - baseShot.w/2,
        y: player.y - baseShot.h/2,
      });
    } else {
      // Tir simple
      shots.push({
        ...baseShot,
        x: player.x + player.w/2 - baseShot.w/2,
        y: player.y - baseShot.h,
      });
    }
    
    bullets.push(...shots);
  }
function drawPowerup(p) {
    ctx.save();
    ctx.fillStyle = p.color;
    // Dessin en forme de losange/carré incliné pour les distinguer
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate(Math.PI / 4); // Rotation à 45 degrés
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    
    // Ajouter une icône (simple texte ici pour l'exemple)
    ctx.rotate(-Math.PI / 4); // Annuler la rotation pour le texte
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.font = "bold 12px system-ui";
    const icon = p.type === 'TRIPLE_SHOT' ? 'T' : p.type === 'SHIELD' ? 'S' : '+';
    ctx.fillText(icon, 0, 4);
    
    ctx.restore();
  }
  function bossFire() {
    if (!boss) return;
    
    // Triple tir
    for (let i = -1; i <= 1; i++) {
      const b = {
        x: boss.x + boss.w/2 - 3 + i * 20,
        y: boss.y + boss.h,
        w: 6,
        h: 12,
        speed: 250,
        color: "#ff5a7a",
        alive: true
      };
      enemyBullets.push(b);
    }
  }

  // ------- Spawn -------
function spawnEnemyWave() {
  const count = Math.floor(randRange(CONFIG.SPAWN.WAVE_MIN, CONFIG.SPAWN.WAVE_MAX));
  
  // Choix du comportement pour toute la vague (optionnel) ou par ennemi
  const behaviors = ['WIGGLE', 'DIVE', 'ZIGZAG'];
  const waveBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];

  for (let i = 0; i < count; i++) {
    const isTough = Math.random() < CONFIG.ENEMY.TOUGH_CHANCE;
    const behavior = waveBehavior; // ou : behaviors[Math.floor(Math.random() * behaviors.length)] pour plus de variété
    
    const w = randRange(CONFIG.ENEMY.MIN_WIDTH, CONFIG.ENEMY.MAX_WIDTH);
    const h = randRange(CONFIG.ENEMY.MIN_HEIGHT, CONFIG.ENEMY.MAX_HEIGHT);
    
    // Position de spawn
    const spawnY = -randRange(40, 140);
    let spawnX = randRange(CONFIG.WORLD.MARGIN + 4, WORLD.w - w - CONFIG.WORLD.MARGIN - 4);

    // Pour V_FORMATION, on pourrait gérer un offset (optionnel)
    if (behavior === 'V_FORMATION') {
      // Simple version : spawn en ligne horizontale
      spawnX = (WORLD.w / (count + 1)) * (i + 1) - w / 2;
    }

    const behavConfig = CONFIG.ENEMY.BEHAVIORS[behavior];
    
    enemies.push({
      x: spawnX,
      y: spawnY,
      w, h,
      hp: isTough ? CONFIG.ENEMY.TOUGH_HP : CONFIG.ENEMY.NORMAL_HP,
      maxHp: isTough ? CONFIG.ENEMY.TOUGH_HP : CONFIG.ENEMY.NORMAL_HP,
      color: isTough ? CONFIG.ENEMY.COLOR_TOUGH : CONFIG.ENEMY.COLOR_NORMAL,
      speedY: WORLD.enemySpeedBase + randRange(CONFIG.ENEMY.SPEED_VARIANCE.MIN, CONFIG.ENEMY.SPEED_VARIANCE.MAX),
      behavior: behavior,
      
      // Variables de comportement
      baseX: spawnX, // pour DIVE / V_FORMATION
      diveActivated: false,
      zigzagPhase: Math.random() * Math.PI * 2,
      formationOffset: behavior === 'V_FORMATION' ? (i - Math.floor(count/2)) * 30 : 0,
      
      // Tir
      fireRate: behavConfig.fireChance > 0 && Math.random() < behavConfig.fireChance ? 2.0 : 0,
      fireCooldown: 0,
      
      alive: true
    });
  }
}

  function spawnBoss() {
    boss = {
      x: WORLD.w / 2 - CONFIG.BOSS.WIDTH / 2,
      y: -CONFIG.BOSS.HEIGHT,
      w: CONFIG.BOSS.WIDTH,
      h: CONFIG.BOSS.HEIGHT,
      hp: CONFIG.BOSS.HP,
      maxHp: CONFIG.BOSS.HP,
      speedX: CONFIG.BOSS.SPEED,
      speedY: 30,
      color: CONFIG.BOSS.COLOR,
      fireCooldown: CONFIG.BOSS.FIRE_RATE,
      alive: true
    };
    WORLD.bossActive = true;
  }

  // ------- Effets visuels -------
  function createExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = randRange(50, 150);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randRange(4, 10), // Taille augmentée pour un meilleur impact visuel
        color: color,
        life: randRange(0.3, 0.8),
        maxLife: 0.8,
        alpha: 1
      });
    }
  }

  function createHitEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x, y,
        vx: randRange(-50, 50), // Vitesse augmentée
        vy: randRange(-50, 50),
        size: randRange(1, 4),
        color: "#ffe066",
        life: 0.2,
        maxLife: 0.2,
        alpha: 1
      });
    }
  }

  // ------- Collisions -------
  function rectsIntersect(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // ------- Helpers dessin -------
  function roundRect(ctx, x, y, w, h, r = 6, fill = false, stroke = false) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // ------- Bouton start -------
  btnStart.addEventListener("click", () => {
    if (WORLD.gameState === 'GAMEOVER' || WORLD.gameState === 'MENU') {
      // Recommencer ou démarrer au dernier niveau joué ou niveau 1
      startGame(WORLD.level); 
    } else if (WORLD.gameState === 'PLAYING' || WORLD.gameState === 'PAUSED') {
      togglePause();
    }
  });

  // Initialisation
  showMenu('main');
  resetPlayer();
  draw();
})();