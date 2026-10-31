/* ═══════════════════════════════════════════════════
   VAMPIRE SIM — game.js
   Moteur de jeu 2D — dépend de map.js et ui.js
   ═══════════════════════════════════════════════════ */

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// ── Guard: ensure map.js is loaded first ──────────
if (typeof MAP_T === "undefined") {
  document.body.innerHTML = `<div style="color:#e74c3c;font-family:monospace;padding:40px;font-size:18px;background:#04060b;height:100vh">
    ❌ <b>Erreur : map.js introuvable.</b><br><br>
    Assurez-vous que <b>tous les fichiers</b> sont dans le <b>même dossier</b> :<br><br>
    <code style="color:#f39c12">index.html &nbsp; map.js &nbsp; game.js &nbsp; ui.js &nbsp; style.css</code>
  </div>`;
  throw new Error("map.js must be loaded before game.js");
}

// Alias les constantes de map.js
const T    = MAP_T;
const COLS = MAP_COLS;
const ROWS = MAP_ROWS;

// ── State ──────────────────────────────────────────
let state, player, npcs, particles, floats, camera;
let fogCanvas;
let keys      = {};
let animID    = null;
let lastTime  = 0;
let waterAnim = 0;

const HUNT_COOLDOWN = 1.2;
const NEAR_RADIUS   = T * 1.8;
const HUNT_RADIUS   = T * 2.8;

// ─── Random events ─────────────────────────────────
const R_EVENTS = [
  { msg: "🔦 Une patrouille passe... +10 suspicion",   fx: s => s.heat   += 10 },
  { msg: "💰 Portefeuille trouvé ! +20$",              fx: s => s.money  += 20 },
  { msg: "🌫️ La nuit est calme. Rien ne se passe.",   fx: ()  => {}            },
  { msg: "🗡️ Un chasseur rôde... +15 suspicion",      fx: s => s.heat   += 15 },
  { msg: "🩸 Faim soudaine... +15 faim",               fx: s => s.hunger += 15 },
  { msg: "👤 Témoin aperçu ! +12 suspicion",           fx: s => s.heat   += 12 },
  { msg: "💸 Vol discret réussi ! +15$",               fx: s => s.money  += 15 },
  { msg: "🐦 Un corbeau vous guide... -8 suspicion",   fx: s => s.heat   -= 8  },
  { msg: "☁️ Nuages couvrent la lune. -5 suspicion",  fx: s => s.heat   -= 5  },
  { msg: "🔔 Les cloches sonnent minuit... +5 faim",   fx: s => s.hunger += 5  },
];

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
function initState() {
  state = { hunger: 30, heat: 0, power: 10, money: 50, turn: 1, alive: true, veilCooldown: 0 };
}

function initPlayer() {
  const sp = MAP_SPAWNS.player;
  player = {
    x: (sp.tx + 0.5) * T,
    y: (sp.ty + 0.5) * T,
    speed: 135,
    facing: "down",
    anim: 0,
    cooldown: 0,
    cape: 0,
    moving: false,
  };
}

function initNPCs() {
  npcs = [];
  for (let i = 0; i < 10; i++) spawnNPC("victim");
  for (let i = 0; i < 4;  i++) spawnNPC("hunter");
}

function spawnNPC(type) {
  const zones = type === "hunter" ? MAP_SPAWNS.hunterZones : MAP_SPAWNS.victimZones;
  const pos   = zones[Math.floor(Math.random() * zones.length)];
  spawnNPCAt(type, pos.tx, pos.ty);
}

function spawnNPCAt(type, tx, ty) {
  const waypointIdx = Math.floor(Math.random() * MAP_SPAWNS.patrolWaypoints.length);
  npcs.push({
    type,
    x: (tx + 0.5) * T, y: (ty + 0.5) * T,
    speed: type === "hunter" ? 62 : 40,
    dir: Math.random() * Math.PI * 2,
    changeTimer: Math.random() * 3,
    anim: Math.random() * Math.PI * 2,
    alertTimer: 0, dead: false,
    waypointIdx, waypointTimer: 0,
    skinVariant: Math.floor(Math.random() * 3),
  });
}

// ══════════════════════════════════════════════════
// INPUT
// ══════════════════════════════════════════════════
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "e" || e.key === "E") tryInteract();
  if ((e.key === "q" || e.key === "Q") && !e.repeat) activateShadowVeil();
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

let touchStart = null;
canvas.addEventListener("touchstart", e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
canvas.addEventListener("touchmove", e => {
  if (!touchStart || !state?.alive) return;
  const dx = e.touches[0].clientX - touchStart.x;
  const dy = e.touches[0].clientY - touchStart.y;
  keys["ArrowRight"] = dx > 18; keys["ArrowLeft"]  = dx < -18;
  keys["ArrowDown"]  = dy > 18; keys["ArrowUp"]    = dy < -18;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener("touchend", () => {
  ["ArrowRight","ArrowLeft","ArrowDown","ArrowUp"].forEach(k => keys[k] = false);
  touchStart = null;
});

// ══════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════
function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function currentTile() { return mapTileAt(player.x, player.y); }
function nearbyVictim() {
  return npcs.find(n => !n.dead && n.type === "victim" && dist(player, n) < NEAR_RADIUS);
}

// ══════════════════════════════════════════════════
// INTERACTIONS
// ══════════════════════════════════════════════════
function tryInteract() {
  if (!state?.alive || player.cooldown > 0) return;
  const victim = nearbyVictim();
  if (victim) { doHunt(victim); return; }
  const zone = currentTile();
  if      (zone === TILE.ALLEY || zone === TILE.SEWER) doHide();
  else if (zone === TILE.GYM)      doTrain();
  else if (zone === TILE.SHOP)     doShop();
  else if (zone === TILE.CEMETERY) doCemetery();
  else if (zone === TILE.CHURCH)   doChurch();
}

function doHunt(victim) {
  state.hunger = clamp(state.hunger - 28);
  state.heat   = clamp(state.heat   + 10);
  spawnBlood(victim.x, victim.y, 42);
  addFloat("🩸 −28 Faim", victim.x, victim.y - 24, "#e74c3c");
  victim.dead = true;
  player.cooldown = HUNT_COOLDOWN;
  setTimeout(() => spawnNPC("victim"), 7000);
  passTurn();
  UI.showEvent("🩸 Vous avez chassé ! La soif est apaisée.");
}

// Pouvoir tactique : voile d'ombre. Éviter la police coûte des ressources.
function activateShadowVeil() {
  if (!state?.alive || state.veilCooldown > 0) return;
  if (state.money < 15) { UI.showEvent("Voile d'ombre : il faut 15$ de composants."); return; }
  if (state.heat < 8) { UI.showEvent("Aucune suspicion à dissiper pour le moment."); return; }
  state.money -= 15;
  state.heat = clamp(state.heat - 24);
  state.veilCooldown = 18;
  player.cooldown = Math.max(player.cooldown, 0.4);
  spawnSpark(player.x, player.y, "#8661cf", 32);
  addFloat("VOILE D'OMBRE −24", player.x, player.y - 35, "#bb9cff");
  UI.updateStats(state);
  UI.showEvent("Voile d'ombre activé : −24 suspicion. Recharge : 18 secondes.");
}

function doHide() {
  const sewer = currentTile() === TILE.SEWER;
  const drop  = sewer ? 30 : 22;
  state.heat   = clamp(state.heat   - drop);
  state.hunger = clamp(state.hunger + 5);
  addFloat(`🌑 −${drop} Suspicion`, player.x, player.y - 30, "#4a90d9");
  spawnSpark(player.x, player.y, sewer ? "#0d3010" : "#0d2040", 22);
  player.cooldown = 0.8;
  passTurn();
  UI.showEvent(sewer
    ? "🚰 Vous plongez dans les égouts... −30 suspicion."
    : "🌑 Vous disparaissez dans l'ombre... −22 suspicion.");
}

function doTrain() {
  if (state.money < 10) { UI.showEvent("❌ Pas assez d'argent ! (10$)"); return; }
  state.power += 5; state.money -= 10;
  addFloat("⚡ +5 Pouvoir", player.x, player.y - 30, "#9b59b6");
  addFloat("−10$", player.x + 22, player.y - 10, "#c9a227");
  spawnSpark(player.x, player.y, "#4a1a8e", 26);
  player.cooldown = 0.8;
  passTurn();
  UI.showEvent("⚡ Entraînement terminé ! +5 Pouvoir");
}

function doShop() {
  if (state.money < 20) { UI.showEvent("❌ Pas assez d'argent ! (20$)"); return; }
  state.hunger = clamp(state.hunger - 25); state.money -= 20;
  addFloat("💊 −25 Faim", player.x, player.y - 30, "#27ae60");
  addFloat("−20$", player.x + 22, player.y - 10, "#c9a227");
  spawnSpark(player.x, player.y, "#1a4a2a", 18);
  player.cooldown = 0.8;
  passTurn();
  UI.showEvent("💊 Élixir consommé. La faim recule.");
}

function doCemetery() {
  if (state.hunger >= 80) { UI.showEvent("❌ Trop affamé pour ritualiser !"); return; }
  state.power  += 3; state.hunger = clamp(state.hunger + 15); state.heat = clamp(state.heat - 5);
  addFloat("☠️ +3 Pouvoir", player.x, player.y - 30, "#7a9a8a");
  spawnSpark(player.x, player.y, "#1a3020", 20);
  player.cooldown = 1.2;
  passTurn();
  UI.showEvent("☠️ Vous puisez l'énergie des morts... +3 Pouvoir.");
}

function doChurch() {
  state.heat   = clamp(state.heat   - 18);
  state.hunger = clamp(state.hunger + 20);
  addFloat("✝️ −18 Suspicion", player.x, player.y - 30, "#c9a227");
  addFloat("+20 Faim !", player.x, player.y - 10, "#e74c3c");
  spawnSpark(player.x, player.y, "#3a2808", 16);
  player.cooldown = 1.0;
  passTurn();
  UI.showEvent("✝️ Vous brûlez en terrain saint... mais vous vous dissimulez.");
}

// ══════════════════════════════════════════════════
// TURN LOGIC
// ══════════════════════════════════════════════════
function passTurn() {
  state.turn++;
  state.hunger = clamp(state.hunger + 10);
  if (Math.random() < 0.45) {
    const ev = R_EVENTS[Math.floor(Math.random() * R_EVENTS.length)];
    ev.fx(state);
    state.hunger = clamp(state.hunger); state.heat = clamp(state.heat);
    state.money  = Math.max(0, state.money);
    setTimeout(() => UI.showEvent(ev.msg), 1600);
  }
  state.hunger = clamp(state.hunger); state.heat = clamp(state.heat);
  checkEnd();
  UI.updateStats(state);
}

function checkEnd() {
  if (!state.alive) return;
  if (state.hunger >= 100)   endGame(false, "Vous avez succombé à la soif du sang... 💀");
  else if (state.heat >= 100) endGame(false, "Les chasseurs vous ont traqué et éliminé... 🔥");
  else if (state.power >= 50) endGame(true,  "Vous êtes devenu le vampire le plus redouté de Noctalis ! 🧛");
}

function endGame(won, msg) {
  state.alive = false;
  cancelAnimationFrame(animID);
  UI.showEndScreen(won, msg, state);
}

// ══════════════════════════════════════════════════
// PARTICLES
// ══════════════════════════════════════════════════
function spawnBlood(x, y, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 100;
    particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, r: 2+Math.random()*4,
      color: `hsl(${Math.random()*18},80%,${14+Math.random()*18}%)`, life: 1.2 });
  }
}
function spawnSpark(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random()*Math.PI*2, s = 20+Math.random()*80;
    particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s-35, r: 1.5+Math.random()*3, color, life: 1.0 });
  }
}
function addFloat(text, x, y, color) { floats.push({ text, x, y, color, life: 2.0, vy: -48 }); }

// ══════════════════════════════════════════════════
// UPDATE
// ══════════════════════════════════════════════════
function updatePlayer(dt) {
  if (!state.alive) return;
  if (player.cooldown > 0) { player.cooldown -= dt; return; }
  let dx = 0, dy = 0;
  if (keys["ArrowLeft"]  || keys["a"] || keys["A"]) dx -= 1;
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += 1;
  if (keys["ArrowUp"]    || keys["w"] || keys["W"]) dy -= 1;
  if (keys["ArrowDown"]  || keys["s"] || keys["S"]) dy += 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
  const spd = player.speed * mapSpeedMod(player.x, player.y) * dt;
  const R   = 14;
  player.moving = (dx !== 0 || dy !== 0);
  const nx = player.x + dx * spd, ny = player.y + dy * spd;
  if (mapWalkable(nx - R, player.y) && mapWalkable(nx + R, player.y)) player.x = nx;
  if (mapWalkable(player.x, ny - R) && mapWalkable(player.x, ny + R)) player.y = ny;
  if (player.moving) {
    player.anim += dt * 8; player.cape += dt * 5;
    if      (dx < 0) player.facing = "left";
    else if (dx > 0) player.facing = "right";
    else if (dy < 0) player.facing = "up";
    else             player.facing = "down";
  }
  // Church passive burn
  if (currentTile() === TILE.CHURCH) {
    state.hunger = clamp(state.hunger + dt * 6);
    if (Math.random() < dt * 0.5) spawnSpark(player.x, player.y, "#3a2808", 4);
    UI.updateStats(state); checkEnd();
  }
}

function updateNPCs(dt) {
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i];
    if (n.dead) { npcs.splice(i, 1); continue; }
    n.changeTimer -= dt;
    if (n.type === "hunter") {
      n.waypointTimer -= dt;
      if (n.waypointTimer <= 0) {
        const wp = MAP_SPAWNS.patrolWaypoints[n.waypointIdx];
        const ddx = wp.x - n.x, ddy = wp.y - n.y;
        if (Math.hypot(ddx, ddy) < T * 1.2)
          n.waypointIdx = (n.waypointIdx + 1) % MAP_SPAWNS.patrolWaypoints.length;
        else
          n.dir = Math.atan2(ddy, ddx) + (Math.random() - 0.5) * 0.6;
        n.waypointTimer = 0.4;
      }
      if (n.alertTimer > 0)
        n.dir = Math.atan2(player.y - n.y, player.x - n.x) + (Math.random() - 0.5) * 0.5;
    } else {
      if (n.changeTimer <= 0) { n.changeTimer = 1.8 + Math.random() * 3.5; n.dir = Math.random() * Math.PI * 2; }
    }
    const spd = n.speed * dt, R = 12;
    const nx = n.x + Math.cos(n.dir) * spd, ny = n.y + Math.sin(n.dir) * spd;
    if (mapWalkable(nx - R, n.y) && mapWalkable(nx + R, n.y)) n.x = nx; else n.dir += Math.PI + (Math.random() - 0.5);
    if (mapWalkable(n.x, ny - R) && mapWalkable(n.x, ny + R)) n.y = ny; else n.dir += Math.PI + (Math.random() - 0.5);
    n.anim += dt * 6;
    if (n.type === "hunter") {
      if (dist(player, n) < HUNT_RADIUS) { n.alertTimer = 2.0; state.heat = clamp(state.heat + dt * 12); UI.updateStats(state); checkEnd(); }
      if (n.alertTimer > 0) n.alertTimer -= dt;
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.87; p.vy *= 0.87; p.vy += 55 * dt;
    p.life -= dt * 1.3;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function updateFloats(dt) {
  for (let i = floats.length - 1; i >= 0; i--) {
    floats[i].y += floats[i].vy * dt; floats[i].life -= dt;
    if (floats[i].life <= 0) floats.splice(i, 1);
  }
}
function updateCamera() {
  camera.x = Math.max(0, Math.min(COLS * T - canvas.width,  player.x - canvas.width  / 2));
  camera.y = Math.max(0, Math.min(ROWS * T - canvas.height, player.y - canvas.height / 2));
}

// ══════════════════════════════════════════════════
// DRAW — MAP
// ══════════════════════════════════════════════════
function drawMap() {
  const sx0 = Math.max(0, Math.floor(camera.x / T));
  const sy0 = Math.max(0, Math.floor(camera.y / T));
  const sx1 = Math.min(COLS, sx0 + Math.ceil(canvas.width  / T) + 2);
  const sy1 = Math.min(ROWS, sy0 + Math.ceil(canvas.height / T) + 2);

  for (let ty = sy0; ty < sy1; ty++) {
    for (let tx = sx0; tx < sx1; tx++) {
      const tile = MAP[ty][tx];
      const cfg  = MAP_TILE_CFG[tile] || MAP_TILE_CFG[TILE.ROAD];
      const sx   = tx * T - camera.x, sy = ty * T - camera.y;
      ctx.fillStyle = cfg.base;
      ctx.fillRect(sx, sy, T, T);
      ctx.strokeStyle = cfg.edge; ctx.lineWidth = 0.5;
      ctx.strokeRect(sx + 0.5, sy + 0.5, T - 1, T - 1);
      switch (tile) {
        case TILE.WALL:     _drawWall(sx,sy,tx,ty);     break;
        case TILE.ROAD:     _drawRoad(sx,sy,tx,ty);     break;
        case TILE.ALLEY:    _drawAlley(sx,sy);          break;
        case TILE.PARK:     _drawPark(sx,sy,tx,ty);     break;
        case TILE.WATER:    _drawWater(sx,sy,tx,ty);    break;
        case TILE.CEMETERY: _drawCemetery(sx,sy,tx,ty); break;
        case TILE.CHURCH:   _drawChurch(sx,sy,tx,ty);   break;
        case TILE.SEWER:    _drawSewer(sx,sy,tx,ty);    break;
        case TILE.GYM:      _drawGym(sx,sy);            break;
        case TILE.SHOP:     _drawShop(sx,sy);           break;
      }
    }
  }

  // Decorations
  for (const d of MAP_DECOS) {
    const sx = d.tx * T - camera.x, sy = d.ty * T - camera.y;
    if (sx < -T || sx > canvas.width + T || sy < -T || sy > canvas.height + T) continue;
    _drawDeco(d, sx + T / 2, sy + T / 2);
  }

  // Lampposts
  for (const lp of MAP_LAMPPOSTS) {
    const sx = lp.tx * T - camera.x + T / 2, sy = lp.ty * T - camera.y + T;
    if (sx < -T || sx > canvas.width + T || sy < -T || sy > canvas.height + T) continue;
    _drawLamppost(sx, sy, lp.warm);
  }

  // POI labels
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "bold 9px 'Cinzel',serif";
  for (const poi of MAP_POIS) {
    const sx = poi.tx * T - camera.x + T / 2, sy = poi.ty * T - camera.y + T * 0.3;
    if (sx < -T * 3 || sx > canvas.width + T * 3 || sy < -T * 2 || sy > canvas.height + T * 2) continue;
    ctx.globalAlpha = 0.38; ctx.fillStyle = poi.color;
    ctx.fillText(poi.icon + " " + poi.name.toUpperCase(), sx, sy);
  }
  ctx.globalAlpha = 1;

  // Fog
  if (fogCanvas) ctx.drawImage(fogCanvas, -camera.x, -camera.y);
}

function _drawWall(sx, sy, tx, ty) {
  const seed = (tx * 7 + ty * 13) % 10;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (let row = 0; row < 3; row++) {
    const off = (row % 2) * 14;
    for (let col = 0; col < 3; col++) ctx.fillRect(sx+3+col*17+off, sy+6+row*15, 14, 11);
  }
  if (seed < 3) {
    ctx.fillStyle = "rgba(255,170,30,0.07)";
    ctx.fillRect(sx+8,sy+7,12,9); ctx.fillRect(sx+28,sy+7,12,9);
    ctx.fillStyle = "rgba(255,170,30,0.04)";
    ctx.fillRect(sx+8,sy+28,12,9); ctx.fillRect(sx+28,sy+28,12,9);
  }
  if (seed > 7) { ctx.fillStyle = "rgba(20,60,20,0.18)"; ctx.fillRect(sx,sy+T-8,T,8); }
}

function _drawRoad(sx, sy, tx, ty) {
  if ((tx+ty)%3===0) {
    ctx.fillStyle = "rgba(255,255,255,0.016)";
    ctx.fillRect(sx+4,sy+4,10,8); ctx.fillRect(sx+22,sy+14,10,8); ctx.fillRect(sx+38,sy+28,10,8);
  }
  if ((ty===9||ty===10||ty===19||ty===20||ty===29||ty===30)&&tx%4===0) {
    ctx.fillStyle="rgba(255,255,255,0.04)"; ctx.fillRect(sx+T/2-1,sy+6,2,T-12);
  }
  if ((tx===12||tx===13||tx===26||tx===27||tx===40||tx===41)&&ty%4===0) {
    ctx.fillStyle="rgba(255,255,255,0.04)"; ctx.fillRect(sx+6,sy+T/2-1,T-12,2);
  }
}

function _drawAlley(sx, sy) {
  ctx.fillStyle = "rgba(0,20,50,0.3)";
  ctx.beginPath(); ctx.ellipse(sx+T*.45,sy+T*.72,T*.22,T*.1,0.2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(0,10,30,0.4)"; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(sx+6,sy+10); ctx.lineTo(sx+18,sy+30); ctx.lineTo(sx+14,sy+46); ctx.stroke();
}

function _drawPark(sx, sy, tx, ty) {
  const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
  g.addColorStop(0,"rgba(0,30,4,0.22)"); g.addColorStop(1,"rgba(0,20,2,0.10)");
  ctx.fillStyle = g; ctx.fillRect(sx,sy,T,T);
  ctx.fillStyle = "rgba(0,80,10,0.2)";
  const seed = (tx*5+ty*9)%6;
  for (let i=0;i<4;i++) ctx.fillRect(sx+4+i*13+(seed*3)%8, sy+8+(seed*2+i*7)%(T-20), 2, 8);
}

function _drawWater(sx, sy, tx, ty) {
  const t = waterAnim + tx*0.7 + ty*1.1;
  ctx.fillStyle = `rgba(15,60,160,${Math.sin(t)*0.03+0.04})`; ctx.fillRect(sx,sy,T,T);
  const rPhase = (waterAnim*0.8+tx*0.4+ty*0.6) % (Math.PI*2);
  ctx.strokeStyle = `rgba(60,120,220,${0.08+Math.sin(rPhase)*0.04})`; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(sx+T/2,sy+T/2,Math.max(0.1,4+Math.sin(rPhase)*8),0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = `rgba(80,150,255,${0.04+Math.sin(t)*0.03+0.03})`; ctx.fillRect(sx+8,sy+T*0.4,T-16,1.5);
}

function _drawCemetery(sx, sy, tx, ty) {
  if ((tx*11+ty*7)%4 < 3) {
    ctx.fillStyle = "rgba(60,80,70,0.35)";
    ctx.fillRect(sx+T/2-2,sy+8,4,18); ctx.fillRect(sx+T/2-8,sy+12,16,4); ctx.fillRect(sx+T/2-7,sy+28,14,4);
  }
  ctx.fillStyle = "rgba(140,180,160,0.04)";
  ctx.fillRect(sx, sy+T*0.6, T, T*(0.3+Math.sin(waterAnim*0.5+tx+ty)*0.02));
}

function _drawChurch(sx, sy, tx, ty) {
  ctx.fillStyle = "rgba(80,60,40,0.12)";
  for (let i=0;i<3;i++) ctx.fillRect(sx+i*18,sy+T-10,15,8);
  ctx.strokeStyle = "rgba(200,160,60,0.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(sx+T/2,sy+16,10,Math.PI,0); ctx.stroke();
  const pulse = 0.04+Math.sin(waterAnim*1.5+tx+ty)*0.02;
  ctx.fillStyle = `rgba(255,220,100,${pulse})`; ctx.fillRect(sx,sy,T,T);
}

function _drawSewer(sx, sy, tx, ty) {
  ctx.fillStyle = "rgba(10,50,10,0.22)"; ctx.fillRect(sx,sy,T,T);
  ctx.strokeStyle = "rgba(0,40,0,0.5)"; ctx.lineWidth = 1.5;
  for (let i=0;i<4;i++) { ctx.beginPath(); ctx.moveTo(sx+4+i*12,sy+4); ctx.lineTo(sx+4+i*12,sy+T-4); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(sx+4,sy+T/2); ctx.lineTo(sx+T-4,sy+T/2); ctx.stroke();
  const drip = (waterAnim*1.5+tx*2+ty)%(Math.PI*2);
  ctx.strokeStyle=`rgba(20,100,20,${0.12+Math.sin(drip)*0.06})`; ctx.lineWidth=0.6;
  ctx.beginPath(); ctx.arc(sx+T/2,sy+T/2,Math.max(0.1,6+Math.sin(drip)*4),0,Math.PI*2); ctx.stroke();
}

function _drawGym(sx, sy) {
  ctx.strokeStyle="rgba(80,20,120,0.2)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.rect(sx+6,sy+6,T-12,T-12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx+T/2,sy+6); ctx.lineTo(sx+T/2,sy+T-6); ctx.moveTo(sx+6,sy+T/2); ctx.lineTo(sx+T-6,sy+T/2); ctx.stroke();
}

function _drawShop(sx, sy) {
  ctx.fillStyle="rgba(100,60,10,0.18)"; ctx.fillRect(sx+5,sy+T-18,T-10,12);
  ctx.fillStyle="rgba(40,160,80,0.12)"; ctx.beginPath(); ctx.arc(sx+14,sy+T-22,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(180,40,40,0.12)"; ctx.beginPath(); ctx.arc(sx+26,sy+T-24,6,0,Math.PI*2); ctx.fill();
}

// ── Decoration renderer ─────────────────────────
function _drawDeco(deco, cx, cy) {
  ctx.save(); ctx.translate(cx, cy);
  switch (deco.type) {
    case "tree":
      ctx.fillStyle="rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(2,12,10,4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1a0e04"; ctx.fillRect(-3,2,6,12);
      ctx.fillStyle="#0d2010"; ctx.beginPath(); ctx.arc(0,-8,16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#102814"; ctx.beginPath(); ctx.arc(-4,-14,11,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#143018"; ctx.beginPath(); ctx.arc(4,-18,9,0,Math.PI*2); ctx.fill();
      break;
    case "bench":
      ctx.fillStyle="#2a1808"; ctx.fillRect(-14,-2,28,4); ctx.fillRect(-12,2,4,6); ctx.fillRect(8,2,4,6);
      ctx.fillStyle="#1a1008"; ctx.fillRect(-10,-6,20,4);
      break;
    case "grave":
      ctx.fillStyle="rgba(50,70,60,0.7)";
      ctx.fillRect(-5,-14,10,16); ctx.fillRect(-8,2,16,4);
      ctx.fillStyle="rgba(30,50,40,0.5)";
      ctx.fillRect(-2,-16,4,6); ctx.fillRect(-6,-12,12,3);
      break;
    case "fountain":
      ctx.strokeStyle="rgba(80,120,180,0.4)"; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(0,4,20,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle="rgba(20,60,160,0.3)"; ctx.beginPath(); ctx.arc(0,4,18,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="rgba(80,80,100,0.5)"; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
      const sp2=(waterAnim*2)%(Math.PI*2);
      ctx.strokeStyle=`rgba(100,160,240,${0.15+Math.sin(sp2)*0.08})`; ctx.lineWidth=1;
      for (let i=0;i<6;i++) { const a=(i/6)*Math.PI*2+sp2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*9,Math.sin(a)*9-6); ctx.stroke(); }
      break;
    case "barrel":
      ctx.fillStyle="#2a1004"; ctx.beginPath(); ctx.ellipse(0,0,8,10,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#0a0802"; ctx.lineWidth=1.5;
      for (const oy of [-5,0,5]) { ctx.beginPath(); ctx.ellipse(0,oy,8,3,0,0,Math.PI*2); ctx.stroke(); }
      break;
    case "crate":
      ctx.fillStyle="#2a1808"; ctx.fillRect(-9,-9,18,18);
      ctx.strokeStyle="#1a1004"; ctx.lineWidth=1; ctx.strokeRect(-9,-9,18,18);
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.moveTo(0,-9); ctx.lineTo(0,9); ctx.stroke();
      break;
    case "rubble":
      ctx.fillStyle="rgba(40,30,30,0.6)";
      for (let i=0;i<5;i++) { ctx.beginPath(); ctx.ellipse(i*7-14, i%2===0?-4:4, 4+i*0.8, 3, i*0.4, 0, Math.PI*2); ctx.fill(); }
      break;
  }
  ctx.restore();
}

function _drawLamppost(sx, sy, warm) {
  ctx.strokeStyle="rgba(60,50,40,0.7)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,sy-30); ctx.lineTo(sx+8,sy-34); ctx.stroke();
  ctx.fillStyle=warm?"rgba(255,180,60,0.85)":"rgba(160,200,255,0.85)";
  ctx.beginPath(); ctx.arc(sx+8,sy-34,5,0,Math.PI*2); ctx.fill();
  const grd=ctx.createRadialGradient(sx+8,sy-34,0,sx+8,sy-34,16);
  grd.addColorStop(0,warm?"rgba(255,190,80,0.18)":"rgba(160,200,255,0.15)");
  grd.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx+8,sy-34,16,0,Math.PI*2); ctx.fill();
}

// ══════════════════════════════════════════════════
// DRAW — ENTITIES
// ══════════════════════════════════════════════════
const SKIN_TONES  = ["#c8a06a","#a06840","#d4b896"];
const HAIR_COLORS = ["#1a0a00","#3a2010","#0a0a14","#6a3010"];

function drawNPC(n) {
  const sx=n.x-camera.x, sy=n.y-camera.y;
  if (sx<-T||sx>canvas.width+T||sy<-T||sy>canvas.height+T) return;
  const bob=Math.sin(n.anim)*2.5, skin=SKIN_TONES[n.skinVariant%3], hair=HAIR_COLORS[n.skinVariant%4];
  ctx.save(); ctx.translate(sx,sy+bob);
  if (n.type==="victim") {
    ctx.fillStyle="rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(0,17,10,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=n.skinVariant===2?"#4a3060":"#6a5040"; ctx.beginPath(); ctx.ellipse(0,6,6,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(0,-9,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=hair; ctx.beginPath(); ctx.arc(0,-12,8,Math.PI*1.1,0); ctx.fill();
    if (n.skinVariant===1) { ctx.fillStyle="#8a3020"; ctx.fillRect(-5,-4,10,3); }
    if (dist(player,n)<NEAR_RADIUS) {
      ctx.fillStyle="#e74c3c"; ctx.font="bold 15px sans-serif"; ctx.textAlign="center";
      ctx.shadowColor="#e74c3c"; ctx.shadowBlur=10; ctx.fillText("!",0,-28); ctx.shadowBlur=0;
    }
  } else {
    const alerting=n.alertTimer>0;
    ctx.fillStyle="rgba(0,0,0,0.32)"; ctx.beginPath(); ctx.ellipse(0,18,12,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=alerting?"#8a1010":"#5a1010"; ctx.beginPath(); ctx.ellipse(0,7,9,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2a1006"; ctx.fillRect(-9,4,18,3);
    ctx.fillStyle="rgba(200,200,220,0.6)"; ctx.fillRect(-1,-1,2,7); ctx.fillRect(-3,2,6,2);
    ctx.fillStyle="#1a0808"; ctx.fillRect(-12,-22,24,5); ctx.fillRect(-7,-38,14,17);
    ctx.fillStyle="#b08060"; ctx.beginPath(); ctx.arc(0,-13,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#3a2010"; ctx.fillRect(-4,-15,3,2); ctx.fillRect(1,-15,3,2);
    if (alerting) {
      ctx.strokeStyle=`rgba(231,76,60,${Math.min(0.4,n.alertTimer/2*0.4)})`; ctx.lineWidth=2;
      ctx.setLineDash([6,4]); ctx.beginPath(); ctx.arc(0,0,HUNT_RADIUS,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle="#f39c12"; ctx.font="bold 18px sans-serif"; ctx.textAlign="center";
      ctx.shadowColor="#f39c12"; ctx.shadowBlur=14; ctx.fillText("!",0,-50); ctx.shadowBlur=0;
    }
  }
  ctx.restore();
}

function drawPlayer() {
  const sx=player.x-camera.x, sy=player.y-camera.y;
  const bob=player.moving?Math.sin(player.anim*0.5)*2.5:0;
  const capeSwing=Math.sin(player.cape)*6, flip=player.facing==="left"?-1:1;
  ctx.save(); ctx.translate(sx,sy+bob);
  if (currentTile()===TILE.SEWER) {
    const g2=ctx.createRadialGradient(0,0,0,0,0,30); g2.addColorStop(0,"rgba(0,80,0,0.12)"); g2.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle="rgba(0,0,0,0.38)"; ctx.beginPath(); ctx.ellipse(0,19,15,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#100202";
  ctx.beginPath(); ctx.moveTo(-14,-4); ctx.quadraticCurveTo(-18+capeSwing*flip,12,-15*flip,24);
  ctx.lineTo(15*flip,24); ctx.quadraticCurveTo(18-capeSwing*flip,12,14,-4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#240404"; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle="rgba(120,0,0,0.18)";
  ctx.beginPath(); ctx.moveTo(-8,10); ctx.lineTo(-12*flip,22); ctx.lineTo(12*flip,22); ctx.lineTo(8,10); ctx.fill();
  ctx.fillStyle="#180404"; ctx.beginPath(); ctx.ellipse(0,5,8,12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#eeeee8"; ctx.fillRect(-2.5,-4,5,11);
  ctx.fillStyle="#0c0202";
  ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(-8,-1); ctx.lineTo(-5,6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(8,-1); ctx.lineTo(5,6); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#c0987a"; ctx.beginPath(); ctx.arc(0,-14,9,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(-5,-12,3,2,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5,-12,3,2,0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#080000"; ctx.beginPath(); ctx.arc(0,-17,9,Math.PI*1.05,0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4,-8); ctx.lineTo(0,-13); ctx.lineTo(4,-8); ctx.fill();
  ctx.shadowColor="#c0392b"; ctx.shadowBlur=14; ctx.fillStyle="#e74c3c";
  ctx.beginPath(); ctx.arc(-3*flip,-14,2.8,0,Math.PI*2); ctx.arc(3*flip,-14,2.8,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle="#f8f8f8"; ctx.fillRect(-4.5,-8,3,6); ctx.fillRect(1.5,-8,3,6);
  ctx.beginPath(); ctx.moveTo(-4.5,-2); ctx.lineTo(-3,2); ctx.lineTo(-1.5,-2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1.5,-2); ctx.lineTo(3,2); ctx.lineTo(4.5,-2); ctx.fill();
  ctx.restore();
  const grd=ctx.createRadialGradient(sx,sy,0,sx,sy,42);
  grd.addColorStop(0,"rgba(140,10,10,0.18)"); grd.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx,sy,42,0,Math.PI*2); ctx.fill();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha=Math.max(0,p.life*0.9); ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x-camera.x,p.y-camera.y,p.r,0,Math.PI*2); ctx.fill();
  }); ctx.globalAlpha=1;
}

function drawFloats() {
  ctx.textAlign="center"; ctx.textBaseline="middle";
  floats.forEach(f => {
    ctx.globalAlpha=Math.min(1,f.life*0.8); ctx.fillStyle=f.color;
    ctx.font="bold 14px 'Crimson Text',serif"; ctx.shadowColor=f.color; ctx.shadowBlur=10;
    ctx.fillText(f.text,f.x-camera.x,f.y-camera.y); ctx.shadowBlur=0;
  }); ctx.globalAlpha=1;
}

function drawVignette() {
  const cx=canvas.width/2, cy=canvas.height/2, r=Math.max(cx,cy)*1.15;
  const grd=ctx.createRadialGradient(cx,cy,r*0.28,cx,cy,r);
  grd.addColorStop(0,"rgba(0,0,0,0)"); grd.addColorStop(1,"rgba(0,0,0,0.82)");
  ctx.fillStyle=grd; ctx.fillRect(0,0,canvas.width,canvas.height);
}

function drawHint() {
  const victim=nearbyVictim(), zone=currentTile();
  let hint="↑↓←→ · WASD pour se déplacer";
  if (victim) hint="[E] 🩸 Chasser la victime";
  else if (zone===TILE.ALLEY)    hint="[E] 🌑 Se cacher dans la ruelle (−22 suspicion)";
  else if (zone===TILE.SEWER)    hint="[E] 🚰 Plonger dans les égouts (−30 suspicion)";
  else if (zone===TILE.GYM)      hint="[E] ⚡ S'entraîner à l'arène (10$, +5 pouvoir)";
  else if (zone===TILE.SHOP)     hint="[E] 💊 Acheter un élixir (20$, −25 faim)";
  else if (zone===TILE.CEMETERY) hint="[E] ☠️ Rituel funèbre (+3 pouvoir, +15 faim)";
  else if (zone===TILE.CHURCH)   hint="[E] ✝️ Entrer en terrain saint — DANGEREUX";
  UI.setHint(hint);
}

// ══════════════════════════════════════════════════
// GAME LOOP
// ══════════════════════════════════════════════════
function loop(ts) {
  const dt=Math.min((ts-lastTime)/1000,0.05); lastTime=ts; waterAnim+=dt*1.4;
  ctx.fillStyle="#04060b"; ctx.fillRect(0,0,canvas.width,canvas.height);
  if (state?.alive) state.veilCooldown = Math.max(0, state.veilCooldown - dt);
  updatePlayer(dt); updateNPCs(dt); updateParticles(dt); updateFloats(dt); updateCamera();
  drawMap(); npcs.forEach(drawNPC); drawPlayer(); drawParticles(); drawFloats(); drawVignette(); drawHint();
  animID=requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════
function resize() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
window.addEventListener("resize",()=>{ resize(); fogCanvas=buildFogCanvas(); });

function startGame() {
  initState(); initPlayer(); initNPCs();
  particles=[]; floats=[]; camera={x:0,y:0}; keys={}; waterAnim=0;
  resize(); fogCanvas=buildFogCanvas();
  UI.updateStats(state); lastTime=performance.now();
  cancelAnimationFrame(animID); animID=requestAnimationFrame(loop);
}

document.getElementById("startBtn").addEventListener("click",()=>{
  document.getElementById("menu").classList.remove("active"); startGame();
});
document.getElementById("restartBtn").addEventListener("click",()=>{
  document.getElementById("endScreen").classList.remove("active");
  document.getElementById("menu").classList.add("active");
  cancelAnimationFrame(animID);
});