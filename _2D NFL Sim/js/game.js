// ══════════════════════════════════════════════════
//  NFL MINI RUN — game.js
//  Features: sprint, stiff arm, power-ups, lives,
//  levels, sound engine, particle effects, screens
// ══════════════════════════════════════════════════

const canvas  = document.getElementById("gameCanvas");
const ctx     = canvas.getContext("2d");
const W       = canvas.width;
const H       = canvas.height;

// ── Audio ──────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur = 0.08, type = "sine", vol = 0.4, delay = 0) {
  try {
    const ac  = getAudio();
    const osc = ac.createOscillator();
    const gain= ac.createGain();
    osc.type  = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + dur + 0.01);
  } catch(e) {}
}
function soundTouchdown() {
  playTone(523, .12, "sine", .5, 0);
  playTone(659, .12, "sine", .5, .1);
  playTone(784, .18, "sine", .5, .2);
  playTone(1047,.25, "sine", .5, .35);
}
function soundTackle() {
  playTone(120, .35, "sawtooth", .5);
  playTone(80,  .2,  "square",   .3, .1);
}
function soundPowerup() {
  playTone(880, .08, "sine", .4, 0);
  playTone(1100,.08, "sine", .4, .08);
  playTone(1320,.12, "sine", .4, .16);
}
function soundSprint()  { playTone(440, .06, "sine", .15); }
function soundStiffArm(){ playTone(300, .12, "square", .3); }
function soundExtraLife(){ playTone(660,.1,"sine",.5,0); playTone(880,.1,"sine",.5,.12); playTone(1100,.2,"sine",.5,.24); }

// ── Particles ──────────────────────────────────────
const particles = [];
function spawnParticles(x, y, color, count = 12, speed = 4) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * .5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (speed * .5 + Math.random() * speed),
      vy: Math.sin(angle) * (speed * .5 + Math.random() * speed),
      life: 1, decay: .03 + Math.random() * .03,
      size: 3 + Math.random() * 5,
      color
    });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x   += p.vx * dt;
    p.y   += p.vy * dt;
    p.vy  += 0.15 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ── Power-ups ──────────────────────────────────────
const POWERUP_TYPES = [
  { type:"star",   emoji:"⭐", color:"#FFB700", label:"BONUS +3",       weight:4 },
  { type:"life",   emoji:"❤️", color:"#e63946", label:"VIE EXTRA !",    weight:2 },
  { type:"sprint", emoji:"⚡", color:"#00ccff", label:"SPRINT INFINI !", weight:3 },
  { type:"shield", emoji:"🛡️", color:"#4cc9f0", label:"BOUCLIER !",     weight:2 },
];
let powerups = [];

function spawnPowerup() {
  const total = POWERUP_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  let chosen = POWERUP_TYPES[0];
  for (const t of POWERUP_TYPES) { r -= t.weight; if (r <= 0) { chosen = t; break; } }
  powerups.push({
    x: 40 + Math.random() * (W - 80),
    y: 110 + Math.random() * (H - 200),
    ...chosen,
    pulse: 0
  });
}

// ── Highscores (top 5) ──────────────────────────────
function getScores() {
  try { return JSON.parse(localStorage.getItem("nfl_scores")) || []; }
  catch { return []; }
}
function saveScore(s) {
  const scores = getScores();
  scores.push(s);
  scores.sort((a, b) => b - a);
  scores.length = Math.min(scores.length, 5);
  localStorage.setItem("nfl_scores", JSON.stringify(scores));
}
function renderTitleScores() {
  const scores = getScores();
  const el = document.getElementById("titleHsList");
  if (!el) return;
  if (!scores.length) { el.innerHTML = '<p style="color:#555;font-size:.9em">Aucun score encore</p>'; return; }
  el.innerHTML = scores.map((s, i) =>
    `<div class="hs-row"><span>#${i+1}</span><span>${s} pts</span></div>`
  ).join("");
}

// ── Game state ─────────────────────────────────────
let player, defenders, score, touchdowns, highscore, lives;
let gameOver, gameStarted, shakeTimer, lastTime;
let sprintEnergy, sprintActive, shieldActive, shieldTimer;
let sprintInfiniteTimer, powerupCollected;
let level, defenderSpeed;
let msgTimer = 0;

function initPlayer() {
  player = {
    x: W / 2 - 20, y: H - 90,
    vx: 0, vy: 0,
    w: 42, h: 54,
    maxSpeed: 5.5, accel: 0.44, friction: 0.87,
    stiffArmCooldown: 0,
    stiffArmActive: 0,
    invincible: 0,      // brief iframe after tackle
    facingLeft: false
  };
}

function spawnDefenders() {
  defenders = [];
  const count = 3 + Math.floor(touchdowns / 2);
  for (let i = 0; i < count; i++) {
    const baseSpeed = 1.3 + touchdowns * 0.1 + Math.random() * 0.5;
    defenders.push({
      x: 30 + Math.random() * (W - 80),
      y: 80 + Math.random() * (H * 0.4),
      w: 38, h: 50,
      speed: Math.min(baseSpeed, 4.5),
      vx: 0, vy: 0,
      wobble: Math.random() * Math.PI * 2
    });
  }
}

function resetGame() {
  score           = 0;
  touchdowns      = 0;
  lives           = 3;
  level           = 1;
  gameOver        = false;
  shakeTimer      = 0;
  lastTime        = 0;
  sprintEnergy    = 100;
  sprintActive    = false;
  shieldActive    = false;
  shieldTimer     = 0;
  sprintInfiniteTimer = 0;
  powerupCollected= 0;
  powerups        = [];
  particles.length = 0;
  highscore       = getScores()[0] || 0;
  initPlayer();
  spawnDefenders();
  spawnPowerup();
  updateHUD();
  setMsg("GO ! Direction l'en-but !");
}

// ── Keys ───────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  // prevent page scroll
  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener("keyup",   e => { keys[e.key.toLowerCase()] = false; });

// ── UI helpers ─────────────────────────────────────
function setMsg(text, duration = 180) {
  const el = document.getElementById("msgLine");
  if (el) el.textContent = text;
  msgTimer = duration;
}
function updateHUD() {
  document.getElementById("hScore").textContent  = score;
  document.getElementById("hHs").textContent     = Math.max(highscore, score);
  document.getElementById("hTd").textContent     = touchdowns;
  document.getElementById("hLevel").textContent  = level;
  const heart = "❤";
  document.getElementById("hLives").textContent  = heart.repeat(Math.max(0, lives)) + "🖤".repeat(Math.max(0, 3 - lives));
  document.getElementById("sprintBar").style.width = sprintEnergy + "%";
  document.getElementById("shieldBar").style.width  = shieldActive ? (shieldTimer / 180 * 100) + "%" : "0%";

  // Active effects
  const fx = [];
  if (shieldActive) fx.push(`<span class="effect-badge">🛡️ BOUCLIER</span>`);
  if (sprintInfiniteTimer > 0) fx.push(`<span class="effect-badge">⚡ SPRINT MAX</span>`);
  document.getElementById("activeEffects").innerHTML = fx.join("");
}

// ── Collision helper ───────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ── Game loop ──────────────────────────────────────
function gameLoop(timestamp) {
  if (!gameStarted) return;
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 16.666, 3); // cap at 3x slowdown
  lastTime = timestamp;

  if (gameOver) {
    drawGameOver();
    requestAnimationFrame(gameLoop);
    return;
  }

  update(dt);
  draw(dt);
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // ── Input ──
  let ax = 0, ay = 0;
  if (keys["arrowleft"]  || keys["q"] || keys["a"]) { ax -= 1; player.facingLeft = true; }
  if (keys["arrowright"] || keys["d"])               { ax += 1; player.facingLeft = false; }
  if (keys["arrowup"]    || keys["z"] || keys["w"])    ay -= 1;
  if (keys["arrowdown"]  || keys["s"])                 ay += 1;
  if (ax !== 0 && ay !== 0) { ax *= .707; ay *= .707; }

  // Sprint
  const wantSprint = keys[" "] || keys["shift"];
  const hasSprint  = sprintEnergy > 0 || sprintInfiniteTimer > 0;
  sprintActive = wantSprint && hasSprint;
  const speedMult = sprintActive ? 1.65 : 1;

  if (sprintActive && sprintInfiniteTimer <= 0) {
    sprintEnergy = Math.max(0, sprintEnergy - 0.8 * dt);
    if (Math.random() < .08) soundSprint();
  } else if (!sprintActive) {
    sprintEnergy = Math.min(100, sprintEnergy + 0.35 * dt);
  }
  if (sprintInfiniteTimer > 0) {
    sprintInfiniteTimer -= dt;
    sprintEnergy = 100;
  }

  // Stiff Arm
  if (player.stiffArmCooldown > 0) player.stiffArmCooldown -= dt;
  if (player.stiffArmActive  > 0) player.stiffArmActive  -= dt;
  if ((keys["e"] || keys["f"]) && player.stiffArmCooldown <= 0) {
    player.stiffArmActive    = 20;
    player.stiffArmCooldown  = 90;
    soundStiffArm();
    // Push nearby defender
    defenders.forEach(def => {
      const cx = def.x + def.w / 2;
      const cy = def.y + def.h / 2;
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const d  = Math.hypot(cx - px, cy - py);
      if (d < 90) {
        const nx = (cx - px) / d;
        const ny = (cy - py) / d;
        def.x += nx * 80;
        def.y += ny * 80;
        spawnParticles(def.x + def.w/2, def.y + def.h/2, "#FFB700", 10, 5);
      }
    });
  }

  if (player.invincible > 0) player.invincible -= dt;

  // Physics
  const maxSpd = player.maxSpeed * speedMult;
  player.vx += ax * player.accel * speedMult * dt;
  player.vy += ay * player.accel * speedMult * dt;
  player.vx *= Math.pow(player.friction, dt);
  player.vy *= Math.pow(player.friction, dt);
  const spd = Math.hypot(player.vx, player.vy);
  if (spd > maxSpd) { player.vx *= maxSpd / spd; player.vy *= maxSpd / spd; }
  player.x  += player.vx * dt;
  player.y  += player.vy * dt;
  player.x   = Math.max(8, Math.min(W - player.w - 8, player.x));
  player.y   = Math.max(8, Math.min(H - player.h - 8, player.y));

  // ── Defenders ──
  defenders.forEach(def => {
    def.wobble += 0.06 * dt;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;

    // Predictive pursuit
    const predict = sprintActive ? 8 : 14;
    const tx = px + player.vx * predict;
    const ty = py + player.vy * predict;
    const dx = tx - (def.x + def.w / 2);
    const dy = ty - (def.y + def.h / 2);
    const dist = Math.hypot(dx, dy) || 1;

    def.vx = (dx / dist) * def.speed;
    def.vy = (dy / dist) * def.speed;
    def.x += def.vx * dt;
    def.y += def.vy * dt;

    // Keep in bounds
    def.x = Math.max(4, Math.min(W - def.w - 4, def.x));
    def.y = Math.max(75, Math.min(H - def.h - 4, def.y));

    // Collision
    if (player.invincible <= 0 && !shieldActive && rectsOverlap(player, def)) {
      handleTackle();
    }
    if (shieldActive && rectsOverlap(player, def)) {
      // Bounce defender
      const nx = (def.x - player.x) / (Math.hypot(def.x - player.x, def.y - player.y) || 1);
      const ny = (def.y - player.y) / (Math.hypot(def.x - player.x, def.y - player.y) || 1);
      def.x += nx * 60;
      def.y += ny * 60;
      spawnParticles(def.x + def.w/2, def.y, "#4cc9f0", 8, 4);
    }
  });

  // ── Power-ups ──
  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    pu.pulse += 0.1 * dt;
    if (rectsOverlap(player, { x: pu.x - 18, y: pu.y - 18, w: 36, h: 36 })) {
      collectPowerup(pu);
      powerups.splice(i, 1);
      powerupCollected++;
      // Spawn another after a delay
      setTimeout(spawnPowerup, 2000 + Math.random() * 3000);
    }
  }

  // ── Touchdown ──
  if (player.y < 72) {
    touchdown();
  }

  // ── Shield timer ──
  if (shieldActive) {
    shieldTimer -= dt;
    if (shieldTimer <= 0) { shieldActive = false; setMsg("Bouclier terminé !"); }
  }

  // ── Message timer ──
  if (msgTimer > 0) msgTimer -= dt;

  // ── Shake ──
  if (shakeTimer > 0) shakeTimer -= dt;

  updateParticles(dt);
  updateHUD();
}

function handleTackle() {
  lives--;
  shakeTimer = 22;
  soundTackle();
  spawnParticles(player.x + player.w/2, player.y + player.h/2, "#e63946", 16, 6);

  if (lives <= 0) {
    gameOver = true;
    const s = score;
    if (s > (getScores()[0] || 0)) saveScore(s); else saveScore(s);
    saveScore(s);
    setTimeout(() => showGameOver(), 400);
  } else {
    player.invincible = 80;
    player.x = W / 2 - 20;
    player.y = H - 90;
    player.vx = 0; player.vy = 0;
    setMsg(`TACKLÉ ! ${lives} vie${lives > 1 ? "s" : ""} restante${lives > 1 ? "s" : ""}`);
    updateHUD();
  }
}

function collectPowerup(pu) {
  soundPowerup();
  spawnParticles(pu.x, pu.y, pu.color, 14, 5);
  switch (pu.type) {
    case "star":
      score += 3;
      setMsg("⭐ BONUS +3 !");
      break;
    case "life":
      if (lives < 5) { lives++; soundExtraLife(); }
      setMsg("❤️ VIE EXTRA !");
      break;
    case "sprint":
      sprintInfiniteTimer = 300;
      sprintEnergy = 100;
      setMsg("⚡ SPRINT INFINI 5s !");
      break;
    case "shield":
      shieldActive = true;
      shieldTimer  = 180;
      setMsg("🛡️ BOUCLIER ACTIVÉ !");
      break;
  }
  updateHUD();
}

function touchdown() {
  touchdowns++;
  score += 6;
  level  = 1 + Math.floor(touchdowns / 3);
  soundTouchdown();
  spawnParticles(player.x + player.w/2, 60, "#FFB700", 24, 7);
  spawnParticles(W/2, 40, "#fff", 12, 5);

  player.x  = W / 2 - 20;
  player.y  = H - 90;
  player.vx *= 0.2;
  player.vy  = 0;

  spawnDefenders();
  spawnPowerup();
  setMsg(`🏈 TOUCHDOWN ! +6 pts — Niveau ${level}`);
  updateHUD();
}

// ── Draw ───────────────────────────────────────────
function draw(dt) {
  ctx.save();

  // Shake
  if (shakeTimer > 0) {
    const s = shakeTimer * 1.6;
    ctx.translate((Math.random() - .5) * s, (Math.random() - .5) * s);
  }

  drawField();
  drawPowerups();
  drawDefenders();
  drawPlayer();
  drawParticles();

  ctx.restore();
}

function drawField() {
  // Grass gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   "#1e4d1e");
  grad.addColorStop(0.5, "#256325");
  grad.addColorStop(1,   "#1a4d1a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Alternating yard stripes
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(0,0,0,.08)";
      ctx.fillRect(0, 75 + i * 60, W, 60);
    }
  }

  // Yard lines
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth   = 2;
  for (let y = 75; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(15, y); ctx.lineTo(W - 15, y); ctx.stroke();
    // Yard markers
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.font = "bold 11px 'Oswald', Arial";
    ctx.textAlign = "left";
    const yd = Math.round(((H - y) / (H - 75)) * 100);
    ctx.fillText(yd, 18, y - 3);
    ctx.textAlign = "right";
    ctx.fillText(yd, W - 18, y - 3);
  }

  // Sidelines
  ctx.strokeStyle = "rgba(255,255,255,.6)";
  ctx.lineWidth   = 3;
  ctx.strokeRect(10, 75, W - 20, H - 85);

  // End zone
  const ezGrad = ctx.createLinearGradient(0, 0, 0, 75);
  ezGrad.addColorStop(0, "rgba(0,48,135,.7)");
  ezGrad.addColorStop(1, "rgba(0,48,135,.3)");
  ctx.fillStyle = ezGrad;
  ctx.fillRect(0, 0, W, 75);

  // End zone border
  ctx.strokeStyle = "#FFB700";
  ctx.lineWidth   = 3;
  ctx.beginPath(); ctx.moveTo(10, 75); ctx.lineTo(W - 10, 75); ctx.stroke();

  // END ZONE text
  ctx.fillStyle = "#FFB700";
  ctx.font      = "bold 28px 'Oswald', Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(255,183,0,.5)";
  ctx.shadowBlur  = 10;
  ctx.fillText("END ZONE", W / 2, 48);
  ctx.shadowBlur  = 0;

  // Arrow guide
  if (player && player.y > H * .5) {
    const alpha = Math.min(1, (player.y - H * .5) / (H * .3)) * (.5 + .3 * Math.sin(Date.now() * .005));
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = "#FFB700";
    ctx.font        = "bold 22px Arial";
    ctx.textAlign   = "center";
    ctx.fillText("▲ EN-BUT ▲", W / 2, H * .55);
    ctx.globalAlpha = 1;
  }
}

function drawPlayer() {
  const p   = player;
  const cx  = p.x + p.w / 2;
  const cy  = p.y + p.h / 2;
  const t   = Date.now() * .001;

  // Invincibility flicker
  if (p.invincible > 0 && Math.floor(p.invincible / 6) % 2 === 0) return;

  ctx.save();
  ctx.translate(cx, cy);
  if (p.facingLeft) ctx.scale(-1, 1);

  // Shield glow
  if (shieldActive) {
    ctx.shadowColor = "#4cc9f0";
    ctx.shadowBlur  = 18;
  }
  // Sprint glow
  if (sprintActive) {
    ctx.shadowColor = "#FFB700";
    ctx.shadowBlur  = 12;
  }

  // Body (jersey #1 blue)
  ctx.fillStyle = "#003087";
  ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h * .68);

  // Pants
  ctx.fillStyle = "#001a50";
  ctx.fillRect(-p.w/2, -p.h/2 + p.h * .62, p.w, p.h * .38);

  // Jersey number
  ctx.fillStyle = "#FFB700";
  ctx.font      = "bold 14px 'Oswald', Arial";
  ctx.textAlign = "center";
  ctx.fillText("1", 0, -p.h/2 + p.h * .38);

  // Helmet
  ctx.fillStyle = "#FFB700";
  ctx.beginPath();
  ctx.ellipse(0, -p.h/2 + 10, p.w * .42, p.h * .22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Helmet face mask
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(p.w * .3, -p.h/2 + 4);
  ctx.lineTo(p.w * .3, -p.h/2 + 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.w * .18, -p.h/2 + 10);
  ctx.lineTo(p.w * .38, -p.h/2 + 10);
  ctx.stroke();

  // Arms running animation
  const runPhase = Math.sin(t * 12 + (sprintActive ? 2 : 0));
  ctx.fillStyle = "#003087";
  // Left arm
  ctx.save();
  ctx.rotate(-0.4 + runPhase * 0.4);
  ctx.fillRect(-p.w/2 - 10, -p.h/2 + 8, 10, 26);
  ctx.restore();
  // Right arm
  ctx.save();
  ctx.rotate(0.4 - runPhase * 0.4);
  ctx.fillRect(p.w/2, -p.h/2 + 8, 10, 26);
  ctx.restore();

  // Football carried (slight bob)
  const ballBob = Math.sin(t * 8) * 2;
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.ellipse(p.w/2 + 2, -p.h/2 + p.h * .5 + ballBob, 10, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(p.w/2 - 2, -p.h/2 + p.h * .5 + ballBob);
  ctx.lineTo(p.w/2 + 6, -p.h/2 + p.h * .5 + ballBob);
  ctx.stroke();

  // Stiff arm
  if (p.stiffArmActive > 0) {
    ctx.fillStyle = "#FFB700";
    ctx.shadowColor = "#FFB700";
    ctx.shadowBlur  = 20;
    ctx.save();
    ctx.rotate(-1.1);
    ctx.fillRect(p.w/2, -p.h/2 + 12, 32, 10);
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  ctx.restore(); // translate/scale
}

function drawDefenders() {
  defenders.forEach((def, idx) => {
    const t = Date.now() * .001;
    ctx.save();
    ctx.translate(def.x + def.w/2, def.y + def.h/2);

    // Face toward player
    const toPlayer = player.x - def.x;
    if (toPlayer < 0) ctx.scale(-1, 1);

    // Running wobble
    const wobble = Math.sin(t * 10 + def.wobble) * 2;

    // Body (red jersey)
    ctx.fillStyle = "#C8102E";
    ctx.fillRect(-def.w/2, -def.h/2, def.w, def.h * .65);

    // Pants
    ctx.fillStyle = "#8a0b1e";
    ctx.fillRect(-def.w/2, -def.h/2 + def.h * .6, def.w, def.h * .4);

    // Jersey number
    ctx.fillStyle = "#fff";
    ctx.font      = "bold 13px 'Oswald', Arial";
    ctx.textAlign = "center";
    ctx.fillText((idx + 50).toString(), 0, -def.h/2 + def.h * .37);

    // Helmet (grey)
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.ellipse(0, -def.h/2 + 10, def.w * .42, def.h * .23, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red stripe on helmet
    ctx.strokeStyle = "#C8102E";
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(-def.w * .3, -def.h/2);
    ctx.lineTo(def.w * .15, -def.h/2 + 18);
    ctx.stroke();

    // Face mask
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(def.w * .28, -def.h/2 + 4);
    ctx.lineTo(def.w * .28, -def.h/2 + 18);
    ctx.stroke();

    // Arms
    ctx.fillStyle = "#C8102E";
    ctx.save(); ctx.rotate(-0.3 + Math.sin(t*10 + def.wobble) * .35);
    ctx.fillRect(-def.w/2 - 9, -def.h/2 + 8, 9, 22);
    ctx.restore();
    ctx.save(); ctx.rotate(0.3 - Math.sin(t*10 + def.wobble) * .35);
    ctx.fillRect(def.w/2, -def.h/2 + 8, 9, 22);
    ctx.restore();

    // Danger indicator (red glow when close)
    const dist = Math.hypot(player.x - def.x, player.y - def.y);
    if (dist < 100) {
      ctx.shadowColor = "rgba(255,0,0,.8)";
      ctx.shadowBlur  = Math.max(0, (100 - dist) / 3);
    }

    ctx.restore();
  });
}

function drawPowerups() {
  powerups.forEach(pu => {
    const t     = Date.now() * .001;
    const bob   = Math.sin(t * 3 + pu.pulse) * 4;
    const scale = 1 + Math.sin(t * 4) * .08;
    const glow  = .5 + Math.sin(t * 5) * .3;

    ctx.save();
    ctx.translate(pu.x, pu.y + bob);
    ctx.scale(scale, scale);

    // Glow ring
    ctx.shadowColor = pu.color;
    ctx.shadowBlur  = 12 + glow * 10;

    // Background circle
    ctx.fillStyle = `rgba(${hexToRgb(pu.color)},.2)`;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = pu.color;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Emoji
    ctx.shadowBlur = 0;
    ctx.font       = "20px Arial";
    ctx.textAlign  = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pu.emoji, 0, 1);
    ctx.textBaseline = "alphabetic";

    ctx.restore();
  });
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.7)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle   = "#C8102E";
  ctx.font        = "bold 58px 'Oswald', Arial";
  ctx.textAlign   = "center";
  ctx.shadowColor = "rgba(200,16,46,.6)";
  ctx.shadowBlur  = 20;
  ctx.fillText("PLAQUÉ !", W/2, H/2 - 30);
  ctx.shadowBlur  = 0;

  ctx.fillStyle = "#FFB700";
  ctx.font      = "bold 30px 'Oswald', Arial";
  ctx.fillText(`Score : ${score}`, W/2, H/2 + 20);

  ctx.fillStyle = "#ccc";
  ctx.font      = "20px 'Rajdhani', Arial";
  ctx.fillText("Appuie sur ENTRÉE pour rejouer", W/2, H/2 + 60);

  drawParticles();
  ctx.restore();
}

// ── Enter to restart when game over ───────────────
window.addEventListener("keydown", e => {
  if (gameOver && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    restartGame();
  }
});

// ── Screen management ──────────────────────────────
function startGame() {
  gameStarted = true;
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameScreen").classList.remove("hidden");
  resetGame();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  document.getElementById("gameOverScreen").classList.add("hidden");
  if (!gameStarted) {
    startGame();
    return;
  }
  resetGame();
}

function goMenu() {
  gameStarted = false;
  gameOver    = false;
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.getElementById("titleScreen").style.display = "flex";
  renderTitleScores();
}

function showHowTo() {
  document.getElementById("howToScreen").classList.remove("hidden");
}
function hideHowTo() {
  document.getElementById("howToScreen").classList.add("hidden");
}

function showGameOver() {
  document.getElementById("goTitle").textContent   = touchdowns > 0 ? "PLAQUÉ !" : "PLAQUÉ !";
  document.getElementById("goScore").textContent   = score;
  document.getElementById("goTd").textContent      = touchdowns;
  document.getElementById("goLevel").textContent   = level;
  document.getElementById("goPowerups").textContent = powerupCollected;

  const hs = getScores()[0] || 0;
  document.getElementById("goHs").textContent = hs;

  const isRecord = score > 0 && score >= hs;
  document.getElementById("goNewRecord").classList.toggle("hidden", !isRecord);

  document.getElementById("gameOverScreen").classList.remove("hidden");
}

// ── Init title ─────────────────────────────────────
renderTitleScores();
gameStarted = false;