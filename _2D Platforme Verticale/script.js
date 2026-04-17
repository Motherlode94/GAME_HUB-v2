const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn       = document.querySelector(".btn_start");
const scoreElement   = document.querySelector(".score");
const timeElement    = document.querySelector(".time");
const healthElement  = document.querySelector(".health");
const coinsElement   = document.querySelector(".coins");
const levelElement   = document.querySelector(".level");
const marketOverlay  = document.querySelector(".market");
const cardButtons    = document.querySelectorAll(".card");

let time = 0;
let timerInterval = null;
let keys = {};

let gameState = {
  started: false,
  paused: false,
  gameOver: false,
  score: 0,
  coins: 0,
  health: 100,
  level: 1,
  heightReached: 0,
  worldSpeed: 1.2,
  marketEvery: 1500,
  nextMarketAt: 1500,
  coinMultiplier: 1
};
let lavaFlameOffset = 0; // animation lave

let player = {
  x: 380,
  y: 340,
  width: 35,
  height: 35,
  velocityY: 0,
  speed: 7,          // ← était 5, plus réactif
  gravity: 0.55,     // ← plus légère pour mieux contrôler
  jumpPower: -13,
  isJumping: true,
  canDoubleJump: false,
  hasDoubleJumped: false,
  coyoteTime: 0,     // ← nouveau : permet de sauter juste après avoir quitté une plateforme
  color: "red"
};

// ─── LAVE ──────────────────────────────────────────────────────────────────
// lava.y = position Y du dessus de la lave sur le canvas
// Elle remonte progressivement depuis le bas
let lava = {
  y: 520,           // démarre sous le canvas
  riseSpeed: 0.35,  // vitesse de remontée (pixels/frame)
  maxY: 520,        // position de départ (reset)
};

let platforms = [];
let coins = [];

// ─── GÉNÉRATION ────────────────────────────────────────────────────────────

function createPlatform(x, y, width = 100, height = 16) {
  return { x, y, width, height };
}

function createCoin(x, y) {
  return { x, y, width: 18, height: 18, collected: false };
}

function generateInitialLevel() {
  platforms = [];
  coins = [];

  // Plateforme de départ solide au centre
  platforms.push(createPlatform(330, 380, 140, 20));

  // Plateformes initiales au-dessus
  for (let i = 0; i < 14; i++) {
    let px = Math.random() * (canvas.width - 120);
    let py = 340 - i * 75;
    platforms.push(createPlatform(px, py, 100, 16));
    if (Math.random() < 0.65) {
      coins.push(createCoin(px + 40, py - 25));
    }
  }
}

function recyclePlatforms() {
  for (let platform of platforms) {
    if (platform.y > canvas.height + 30) {
      platform.y = -20;
      platform.x = Math.random() * (canvas.width - platform.width);
      if (Math.random() < 0.8) {
        coins.push(createCoin(platform.x + platform.width / 2 - 9, platform.y - 25));
      }
    }
  }
  coins = coins.filter(c => !c.collected && c.y < canvas.height + 30);
}

// ─── DESSIN ────────────────────────────────────────────────────────────────

function drawBackground() {
  // Fond sombre façon caverne/volcan
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1e1e2f");
  gradient.addColorStop(0.6, "#2d1200");
  gradient.addColorStop(1, "#1a0a00");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Petites étincelles en fond
  ctx.fillStyle = "rgba(255, 120, 0, 0.15)";
  for (let i = 0; i < 6; i++) {
    let sx = (lavaFlameOffset * 3 + i * 137) % canvas.width;
    let sy = lava.y - 40 - (i * 20) % 80;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLava() {
  const t = lavaFlameOffset;

  // ── Surface ondulée
  ctx.beginPath();
  ctx.moveTo(0, lava.y);

  for (let x = 0; x <= canvas.width; x += 8) {
    const wave =
      Math.sin((x + t * 2.5) * 0.04) * 6 +
      Math.sin((x - t * 1.8) * 0.07) * 4;
    ctx.lineTo(x, lava.y + wave);
  }

  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();

  // Corps lave
  const lavaGrad = ctx.createLinearGradient(0, lava.y, 0, canvas.height);
  lavaGrad.addColorStop(0, "#ff6600");
  lavaGrad.addColorStop(0.2, "#cc2200");
  lavaGrad.addColorStop(1, "#660000");
  ctx.fillStyle = lavaGrad;
  ctx.fill();

  // ── Flammes au-dessus de la surface
  drawFlames();

  // ── Lueur orange projetée vers le haut
  const glowGrad = ctx.createLinearGradient(0, lava.y - 80, 0, lava.y);
  glowGrad.addColorStop(0, "rgba(255, 80, 0, 0)");
  glowGrad.addColorStop(1, "rgba(255, 80, 0, 0.22)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, lava.y - 80, canvas.width, 80);
}

function drawFlames() {
  const t = lavaFlameOffset;
  const flameCount = 14;

  for (let i = 0; i < flameCount; i++) {
    const baseX = (i / flameCount) * canvas.width + Math.sin(t * 0.05 + i) * 12;
    const baseY = lava.y + Math.sin((baseX + t * 2) * 0.04) * 5;
    const height = 18 + Math.sin(t * 0.08 + i * 1.3) * 12;
    const width  = 14 + Math.cos(t * 0.06 + i) * 5;

    const flameGrad = ctx.createRadialGradient(
      baseX, baseY - height * 0.5, 2,
      baseX, baseY, width
    );
    flameGrad.addColorStop(0, "rgba(255, 255, 100, 0.95)");
    flameGrad.addColorStop(0.4, "rgba(255, 140, 0, 0.8)");
    flameGrad.addColorStop(1, "rgba(200, 0, 0, 0)");

    ctx.beginPath();
    ctx.moveTo(baseX - width / 2, baseY);
    ctx.quadraticCurveTo(
      baseX - width * 0.3,
      baseY - height * 0.6,
      baseX,
      baseY - height
    );
    ctx.quadraticCurveTo(
      baseX + width * 0.3,
      baseY - height * 0.6,
      baseX + width / 2,
      baseY
    );
    ctx.closePath();
    ctx.fillStyle = flameGrad;
    ctx.fill();
  }
}

function drawPlatforms() {
  for (let platform of platforms) {
    // Corps
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    // Reflet haut
    ctx.fillStyle = "#8b5e3c";
    ctx.fillRect(platform.x, platform.y, platform.width, 4);
    // Bordure gauche lumineuse (lueur lave)
    ctx.fillStyle = "rgba(255,80,0,0.15)";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  }
}

function drawCoins() {
  for (let coin of coins) {
    if (!coin.collected) {
      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(coin.x + 9, coin.y + 9, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe566";
      ctx.beginPath();
      ctx.arc(coin.x + 6, coin.y + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  // Yeux
  ctx.fillStyle = "white";
  ctx.fillRect(player.x + 6,  player.y + 8, 8, 8);
  ctx.fillRect(player.x + 21, player.y + 8, 8, 8);
  ctx.fillStyle = "#111";
  ctx.fillRect(player.x + 9,  player.y + 11, 4, 4);
  ctx.fillRect(player.x + 24, player.y + 11, 4, 4);
}

function drawDangerWarning() {
  // Clignotement rouge en bas si la lave est proche du joueur
  const dist = player.y + player.height - lava.y;
  if (dist > -80 && dist < 0) {
    const alpha = Math.abs(dist) < 40 ? 0.35 : 0.15;
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff4400";
  ctx.font = "bold 42px Poppins, Arial";
  ctx.textAlign = "center";
  ctx.fillText("💀 Game Over", canvas.width / 2, canvas.height / 2 - 16);

  ctx.font = "18px Poppins, Arial";
  ctx.fillStyle = "#ccc";
  ctx.fillText("La lave t'a rattrapé !", canvas.width / 2, canvas.height / 2 + 22);
  ctx.fillText("Appuie sur Start pour rejouer", canvas.width / 2, canvas.height / 2 + 52);
  ctx.textAlign = "left";
}

// ─── MISE À JOUR ───────────────────────────────────────────────────────────

function updateWorld() {
  for (let platform of platforms) {
    platform.y += gameState.worldSpeed;
  }
  for (let coin of coins) {
    if (!coin.collected) coin.y += gameState.worldSpeed;
  }

  // La lave remonte indépendamment du worldSpeed
  // Elle descend légèrement avec le scroll mais monte plus vite → effet de rattrapage
  lava.y -= lava.riseSpeed;
  // Le scroll du monde "repousse" un tout petit peu la lave vers le bas
  lava.y += gameState.worldSpeed * 0.3;

  lavaFlameOffset++;

  gameState.heightReached += gameState.worldSpeed;
  gameState.score = Math.floor(gameState.heightReached);
}

function updatePlayer() {
  // Gravité
  player.velocityY += player.gravity;
  // Clamp vitesse de chute max
  if (player.velocityY > 18) player.velocityY = 18;

  player.y += player.velocityY;

  let landed = false;

  for (let platform of platforms) {
    const pw = platform.x + platform.width;
    const ph = platform.y + platform.height;

    // Le joueur doit être horizontalement sur la plateforme
    const overlapX =
      player.x + player.width > platform.x + 2 &&
      player.x < pw - 2;

    if (!overlapX) continue;

    const playerFoot = player.y + player.height;
    const prevFoot   = playerFoot - player.velocityY;

    // Atterrissage par le dessus uniquement
    if (
      prevFoot <= platform.y + 4 &&
      playerFoot >= platform.y &&
      player.velocityY >= 0
    ) {
      player.y         = platform.y - player.height;
      player.velocityY = 0;
      player.isJumping = false;
      player.hasDoubleJumped = false;
      player.coyoteTime = 6; // frames de grâce
      landed = true;
      break;
    }
  }

  if (!landed) {
    if (player.coyoteTime > 0) {
      player.coyoteTime--;
    } else {
      player.isJumping = true;
    }
  }

  // Mort par lave ou chute hors canvas
  if (player.y + player.height >= lava.y) gameOver();
  if (player.y > canvas.height + 40)      gameOver();
}

function movePlayer() {
  const acc = 1.8;    // accélération
  const fric = 0.78;  // friction

  if (!player.velX) player.velX = 0;

  if (keys["ArrowLeft"] || keys["q"]) {
    player.velX -= acc;
  } else if (keys["ArrowRight"] || keys["d"]) {
    player.velX += acc;
  } else {
    player.velX *= fric; // glissement naturel
  }

  // Clamp vitesse max
  if (player.velX > player.speed)  player.velX = player.speed;
  if (player.velX < -player.speed) player.velX = -player.speed;

  player.x += player.velX;

  if (player.x < 0) { player.x = 0; player.velX = 0; }
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
    player.velX = 0;
  }
}

function jump() {
  // Saut normal (au sol ou coyote time)
  if (!player.isJumping || player.coyoteTime > 0) {
    player.velocityY   = player.jumpPower;
    player.isJumping   = true;
    player.coyoteTime  = 0;
    return;
  }
  // Double saut
  if (player.canDoubleJump && !player.hasDoubleJumped) {
    player.velocityY      = player.jumpPower * 0.9;
    player.hasDoubleJumped = true;
  }
}

function checkCoinCollision() {
  for (let coin of coins) {
    if (
      !coin.collected &&
      player.x < coin.x + coin.width &&
      player.x + player.width > coin.x &&
      player.y < coin.y + coin.height &&
      player.y + player.height > coin.y
    ) {
      coin.collected = true;
      gameState.coins += 1 * gameState.coinMultiplier;
    }
  }
}

// ─── MARCHÉ ────────────────────────────────────────────────────────────────

function getRandomCards() {
  const pool = [
    { name: "💰 Coins ×2",    apply: () => { gameState.coinMultiplier *= 2; } },
    { name: "🦅 Double Saut", apply: () => { player.canDoubleJump = true; } },
    { name: "🚀 Super Saut",  apply: () => { player.jumpPower -= 2; } },
    { name: "⚡ Vitesse +1",  apply: () => { player.speed += 1; } },
    { name: "❤️ Soin +25",    apply: () => { gameState.health = Math.min(100, gameState.health + 25); } },
    { name: "🧊 Lave ralentie", apply: () => { lava.riseSpeed = Math.max(0.1, lava.riseSpeed - 0.1); } },
    { name: "⏱️ Temps gelé", apply: () => { if (timerInterval) clearInterval(timerInterval); } }
  ];

  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
}

function openMarket() {
  gameState.paused = true;

  const choices = getRandomCards();
  cardButtons.forEach((btn, i) => {
    btn.textContent = choices[i].name;
    btn.onclick = () => {
      choices[i].apply();
      closeMarket();
    };
  });

  marketOverlay.classList.remove("hidden");
}

function closeMarket() {
  marketOverlay.classList.add("hidden");
  gameState.level++;
  gameState.worldSpeed  += 0.2;
  lava.riseSpeed        += 0.05; // la lave accélère aussi à chaque niveau
  gameState.nextMarketAt += gameState.marketEvery;
  gameState.paused = false;
}

function checkMarketTrigger() {
  if (gameState.heightReached >= gameState.nextMarketAt) {
    openMarket();
  }
}

// ─── UI ────────────────────────────────────────────────────────────────────

function updateTimerDisplay() {
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  timeElement.textContent =
    "Time: " + String(minutes).padStart(2,"0") + ":" + String(seconds).padStart(2,"0");
}

function updateUI() {
  scoreElement.textContent  = "Height: " + Math.floor(gameState.heightReached);
  coinsElement.textContent  = "Coins: "  + Math.floor(gameState.coins);
  healthElement.textContent = "Health: " + gameState.health;
  levelElement.textContent  = "Level: "  + gameState.level;
  updateTimerDisplay();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState.started && !gameState.paused && !gameState.gameOver) {
      time++;
      updateTimerDisplay();
    }
  }, 1000);
}

// ─── RESET / GAME OVER ─────────────────────────────────────────────────────

function resetGame() {
  gameState.started       = true;
  gameState.paused        = false;
  gameState.gameOver      = false;
  gameState.score         = 0;
  gameState.coins         = 0;
  gameState.health        = 100;
  gameState.level         = 1;
  gameState.heightReached = 0;
  gameState.worldSpeed    = 1.2;
  gameState.nextMarketAt  = gameState.marketEvery;
  gameState.coinMultiplier = 1;

  player.x             = 380;
  player.y             = 340;
  player.velocityY     = 0;
  player.isJumping     = true;
  player.canDoubleJump = false;
  player.hasDoubleJumped = false;
  player.speed         = 5;
  player.jumpPower     = -14;
  player.velX       = 0;
  player.coyoteTime = 0;

  lava.y         = canvas.height + 20;
  lava.riseSpeed = 0.35;

  time = 0;
  lavaFlameOffset = 0;

  marketOverlay.classList.add("hidden");

  generateInitialLevel();
  updateUI();
  startTimer();
}

function gameOver() {
  gameState.gameOver = true;
  gameState.started  = false;
}

// ─── GAME LOOP ─────────────────────────────────────────────────────────────

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  if (gameState.started && !gameState.paused && !gameState.gameOver) {
    movePlayer();
    updatePlayer();
    updateWorld();
    recyclePlatforms();
    checkCoinCollision();
    checkMarketTrigger();
    updateUI();
  }

  drawPlatforms();
  drawCoins();
  drawLava();        // lave par-dessus les plateformes du bas
  drawPlayer();
  drawDangerWarning();

  if (gameState.gameOver) drawGameOver();

  requestAnimationFrame(gameLoop);
}

// ─── EVENTS ────────────────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (
    (e.key === " " || e.key === "ArrowUp" || e.key === "z") &&
    gameState.started && !gameState.paused
  ) {
    jump();
  }
});

document.addEventListener("keyup", (e) => { keys[e.key] = false; });

startBtn.onclick = () => resetGame();

// ─── INIT ──────────────────────────────────────────────────────────────────

updateUI();
gameLoop();