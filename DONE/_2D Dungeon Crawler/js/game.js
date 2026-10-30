// ==================== CONFIG ====================
const COLS = 25, ROWS = 15;
const TS = 36;

const canvas  = document.getElementById('gameCanvas');
canvas.width  = COLS * TS;
canvas.height = ROWS * TS;
const ctx = canvas.getContext('2d');

const miniCanvas = document.getElementById('minimap-canvas');
const mCtx = miniCanvas.getContext('2d');

// ==================== STATE ====================
let player = {};
let enemies = [];
let dungeon = [];
let combat  = null;
let message = "";
let animTick = 0;
let inputCooldown = false;
let particles = [];
let screenShake = {x:0, y:0, dur:0};
let floatingTexts = [];
let dungeonLevel = 1;

// ==================== ENEMY TEMPLATES ====================
const enemyTemplates = {
  goblin: {
    name:'Gobelin', symbol:'g', baseHp:14, baseAtk:5, baseDef:1, baseXp:25,
    color:'#3dba4e', darkColor:'#1e6028', bodyColor:'#2d8a3e',
    minLevel:1, skills:['poison']
  },
  orc: {
    name:'Orc', symbol:'o', baseHp:28, baseAtk:8, baseDef:4, baseXp:60,
    color:'#d4701a', darkColor:'#7a3c0a', bodyColor:'#a85014',
    minLevel:1, skills:['rage']
  },
  skeleton: {
    name:'Squelette', symbol:'s', baseHp:18, baseAtk:7, baseDef:2, baseXp:45,
    color:'#e8e0c8', darkColor:'#a09880', bodyColor:'#c8c0a0',
    minLevel:2, skills:['undying']
  },
  mage: {
    name:'Mage Noir', symbol:'m', baseHp:16, baseAtk:12, baseDef:1, baseXp:80,
    color:'#8844cc', darkColor:'#441166', bodyColor:'#6633aa',
    minLevel:3, skills:['spellcast']
  },
  boss: {
    name:'Seigneur des Ombres', symbol:'B', baseHp:80, baseAtk:15, baseDef:8, baseXp:300,
    color:'#ff2244', darkColor:'#770011', bodyColor:'#cc1133',
    minLevel:1, isBoss:true, skills:['rage','spellcast']
  }
};

// Tile codes:
// 0=wall, 1=floor, 2=exit, 3=special floor, 4=chest_common, 5=chest_rare, 6=armory, 7=library

// ==================== PARTICLES ====================
function spawnParticles(x, y, color, count, type='spark') {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'blood' ? 1 + Math.random() * 3 : 2 + Math.random() * 4;
    particles.push({
      x: x * TS + TS/2, y: y * TS + TS/2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type==='xp'?2:0),
      life: 1.0,
      decay: 0.025 + Math.random()*0.03,
      color, size: type==='blood'?3:type==='xp'?4:2,
      type
    });
  }
}

function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({
    x: x * TS + TS/2, y: y * TS,
    vy: -1.2, life: 1.0, decay: 0.02,
    text, color, size: 12
  });
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1; // gravity
    p.life -= p.decay;
    return p.life > 0;
  });
  floatingTexts = floatingTexts.filter(f => {
    f.y += f.vy; f.life -= f.decay;
    return f.life > 0;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    if (p.type === 'xp') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.restore();
  });
  floatingTexts.forEach(f => {
    ctx.save();
    ctx.globalAlpha = f.life;
    ctx.fillStyle = f.color;
    ctx.font = `bold ${f.size}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  });
}

// ==================== DUNGEON GEN ====================
function generateRooms(targetCount) {
  let rooms = [], attempts = 0;
  while (rooms.length < targetCount && attempts++ < 1000) {
    let w = 3 + Math.floor(Math.random() * 5);
    let h = 2 + Math.floor(Math.random() * 4);
    let x = 1 + Math.floor(Math.random() * (COLS - w - 2));
    let y = 1 + Math.floor(Math.random() * (ROWS - h - 2));
    let room = {x, y, w, h, type:'normal'};
    let overlaps = rooms.some(r =>
      room.x < r.x + r.w + 1 && room.x + room.w + 1 > r.x &&
      room.y < r.y + r.h + 1 && room.y + room.h + 1 > r.y
    );
    if (!overlaps) rooms.push(room);
  }
  return rooms;
}

function carveRoom(room, index, total) {
  // Special room types
  if (index > 0 && index < total - 1) {
    let roll = Math.random();
    if (roll < 0.15) room.type = 'armory';
    else if (roll < 0.28) room.type = 'library';
  }
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++)
      dungeon[y][x] = (room.type === 'armory' || room.type === 'library') ? 3 : 1;
}

function connectRooms(a, b) {
  let ax = a.x + Math.floor(a.w / 2), ay = a.y + Math.floor(a.h / 2);
  let bx = b.x + Math.floor(b.w / 2), by = b.y + Math.floor(b.h / 2);
  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) dungeon[ay][x] = 1;
  for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) dungeon[y][bx] = 1;
}

function generateDungeon() {
  dungeon = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  let numRooms = 5 + Math.min(player.level, 9);
  let rooms = generateRooms(numRooms);
  rooms.sort((a, b) => a.x - b.x || a.y - b.y);
  rooms.forEach((r, i) => carveRoom(r, i, rooms.length));
  for (let i = 0; i < rooms.length - 1; i++) connectRooms(rooms[i], rooms[i + 1]);

  let start = rooms[0];
  player.x = start.x + Math.floor(start.w / 2);
  player.y = start.y + Math.floor(start.h / 2);

  // Place special items in special rooms
  rooms.forEach((r, i) => {
    if (i === 0 || i === rooms.length - 1) return;
    let cx = r.x + Math.floor(r.w / 2);
    let cy = r.y + Math.floor(r.h / 2);
    if (r.type === 'armory') dungeon[cy][cx] = 6;
    else if (r.type === 'library') dungeon[cy][cx] = 7;
  });

  let exit = rooms[rooms.length - 1];
  dungeon[exit.y + Math.floor(exit.h / 2)][exit.x + Math.floor(exit.w / 2)] = 2;

  enemies = [];
  let goblinCount = 3 + player.level;
  let orcCount = Math.floor(player.level / 2);
  let skelCount = player.level >= 2 ? Math.floor(player.level / 2) : 0;
  let mageCount = player.level >= 3 ? Math.floor(player.level / 3) : 0;

  for (let i = 0; i < goblinCount; i++) placeRandomEnemy('goblin');
  for (let i = 0; i < orcCount; i++) placeRandomEnemy('orc');
  for (let i = 0; i < skelCount; i++) placeRandomEnemy('skeleton');
  for (let i = 0; i < mageCount; i++) placeRandomEnemy('mage');

  // Boss every 5 dungeon levels
  if (dungeonLevel % 5 === 0) placeRandomEnemy('boss');

  // Chests
  let commonChests = 3 + Math.floor(player.level / 2);
  let rareChests = 1 + Math.floor(player.level / 4);
  for (let i = 0; i < commonChests; i++) placeThing(4);
  for (let i = 0; i < rareChests; i++) placeThing(5);
}

function placeThing(type) {
  for (let a = 0; a < 300; a++) {
    let x = 1 + Math.floor(Math.random() * (COLS - 2));
    let y = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (dungeon[y][x] === 1) { dungeon[y][x] = type; return; }
  }
}

function placeRandomEnemy(key) {
  let t = enemyTemplates[key];
  let scale = 1 + (player.level - 1) * 0.3;
  for (let a = 0; a < 300; a++) {
    let x = 1 + Math.floor(Math.random() * (COLS - 2));
    let y = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (dungeon[y][x] === 1 && !enemies.some(e => e.x === x && e.y === y) &&
        !(x === player.x && y === player.y)) {
      enemies.push({
        x, y,
        name: t.name, symbol: t.symbol,
        color: t.color, darkColor: t.darkColor, bodyColor: t.bodyColor,
        hp: Math.floor(t.baseHp * scale), maxhp: Math.floor(t.baseHp * scale),
        atk: Math.floor(t.baseAtk * scale), def: Math.floor(t.baseDef * scale),
        xp: Math.floor(t.baseXp * scale),
        wobble: Math.random() * Math.PI * 2,
        skills: t.skills || [],
        isBoss: t.isBoss || false,
        rageActive: false,
        poisonTurns: 0,
        patrol: { dx: Math.random()<0.5?1:-1, dy:0, timer:0 }
      });
      return;
    }
  }
}

// ==================== TILE RENDERING ====================
function drawTile(x, y) {
  const px = x * TS, py = y * TS;
  const tile = dungeon[y][x];

  if (tile === 0) {
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(px, py, TS, TS);
    ctx.fillStyle = '#221a12';
    ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2);
    ctx.fillStyle = '#2e241a';
    ctx.fillRect(px + 3, py + 3, TS - 6, TS - 6);
    ctx.fillStyle = '#181210';
    ctx.fillRect(px + 5, py + 8, 6, 3);
    ctx.fillRect(px + 18, py + 20, 8, 3);
    ctx.fillRect(px + 8, py + 25, 5, 3);
  } else if (tile === 3) {
    // Special room floor
    ctx.fillStyle = '#1a1420';
    ctx.fillRect(px, py, TS, TS);
    ctx.fillStyle = '#221830';
    ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2);
    ctx.strokeStyle = '#332240';
    ctx.lineWidth = 0.5;
    if (x % 4 === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + TS); ctx.stroke(); }
    if (y % 3 === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TS, py); ctx.stroke(); }
  } else {
    ctx.fillStyle = '#1e180f';
    ctx.fillRect(px, py, TS, TS);
    ctx.fillStyle = '#251e14';
    ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2);
    ctx.strokeStyle = '#181210';
    ctx.lineWidth = 0.5;
    if (x % 4 === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + TS); ctx.stroke(); }
    if (y % 3 === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TS, py); ctx.stroke(); }
  }

  // Exit portal
  if (tile === 2) {
    let pulse = 0.7 + 0.3 * Math.sin(animTick * 0.05);
    ctx.fillStyle = `rgba(160, 60, 200, ${pulse * 0.8})`;
    ctx.fillRect(px + 4, py + 4, TS - 8, TS - 8);
    ctx.fillStyle = `rgba(220, 120, 255, ${pulse})`;
    ctx.font = `bold ${TS - 8}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▼', px + TS / 2, py + TS / 2 + 1);
    // Portal glow particles occasionally
    if (Math.random() < 0.15) {
      particles.push({
        x: px + 4 + Math.random()*(TS-8), y: py + 4 + Math.random()*(TS-8),
        vx: (Math.random()-0.5)*1, vy: -1-Math.random(),
        life: 1, decay: 0.04, color:'#dd88ff', size:2, type:'spark'
      });
    }
  }

  // Common chest
  if (tile === 4) {
    let s = 0.8 + 0.2 * Math.sin(animTick * 0.07 + x + y);
    ctx.fillStyle = `rgba(120, 80, 10, ${s})`;
    ctx.fillRect(px + 6, py + 10, TS - 12, TS - 16);
    ctx.fillStyle = `rgba(190, 150, 30, ${s})`;
    ctx.fillRect(px + 6, py + 10, TS - 12, 5);
    ctx.fillStyle = `rgba(255, 220, 80, ${s})`;
    ctx.fillRect(px + TS/2 - 3, py + 11, 6, 6);
  }

  // Rare chest
  if (tile === 5) {
    let s = 0.85 + 0.15 * Math.sin(animTick * 0.09 + x + y);
    ctx.fillStyle = `rgba(20, 10, 80, ${s})`;
    ctx.fillRect(px + 5, py + 9, TS - 10, TS - 14);
    ctx.fillStyle = `rgba(100, 50, 200, ${s})`;
    ctx.fillRect(px + 5, py + 9, TS - 10, 6);
    ctx.fillStyle = `rgba(180, 120, 255, ${s})`;
    ctx.fillRect(px + TS/2 - 3, py + 10, 6, 6);
    // Sparkle
    let sparkle = 0.5 + 0.5 * Math.sin(animTick * 0.12 + x * y);
    ctx.fillStyle = `rgba(255, 200, 255, ${sparkle})`;
    ctx.fillRect(px + 5, py + 5, 3, 3);
    ctx.fillRect(px + TS - 8, py + 5, 3, 3);
  }

  // Armory
  if (tile === 6) {
    let pulse = 0.7 + 0.3 * Math.sin(animTick * 0.06 + x);
    ctx.fillStyle = `rgba(180,140,60, ${pulse})`;
    ctx.font = `bold ${TS-6}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🗡', px + TS/2, py + TS/2);
  }

  // Library
  if (tile === 7) {
    let pulse = 0.7 + 0.3 * Math.sin(animTick * 0.06 + y);
    ctx.fillStyle = `rgba(80,160,255, ${pulse})`;
    ctx.font = `bold ${TS-6}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📖', px + TS/2, py + TS/2);
  }
}

// ==================== ENEMY RENDERING ====================
function drawEnemy(e) {
  const px = e.x * TS + TS / 2;
  const py = e.y * TS + TS / 2;
  const bob = Math.sin(animTick * 0.06 + e.wobble) * 2;

  // Boss glow
  if (e.isBoss) {
    let glow = 0.3 + 0.2 * Math.sin(animTick * 0.08);
    ctx.save();
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur = 20 + glow * 10;
  }

  if (e.symbol === 'g') {
    drawGoblin(px, py, bob, e);
  } else if (e.symbol === 'o') {
    drawOrc(px, py, bob, e);
  } else if (e.symbol === 's') {
    drawSkeleton(px, py, bob, e);
  } else if (e.symbol === 'm') {
    drawMage(px, py, bob, e);
  } else if (e.symbol === 'B') {
    drawBoss(px, py, bob, e);
  }

  if (e.isBoss) ctx.restore();

  // Rage indicator
  if (e.rageActive) {
    ctx.fillStyle = `rgba(255,50,0,${0.5+0.3*Math.sin(animTick*0.2)})`;
    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', px, e.y * TS - 2);
  }

  // HP bar
  let hpPct = e.hp / e.maxhp;
  let bw = TS - 6;
  ctx.fillStyle = '#330000';
  ctx.fillRect(e.x * TS + 3, e.y * TS + 1, bw, 3);
  ctx.fillStyle = hpPct > 0.5 ? '#22cc44' : hpPct > 0.25 ? '#ffaa00' : '#ee2222';
  ctx.fillRect(e.x * TS + 3, e.y * TS + 1, bw * hpPct, 3);
}

function drawGoblin(px, py, bob, e) {
  ctx.fillStyle = e.bodyColor;
  ctx.beginPath(); ctx.ellipse(px, py + 4 + bob, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.ellipse(px, py - 5 + bob, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.fillRect(px - 4, py - 7 + bob, 2, 2);
  ctx.fillRect(px + 2, py - 7 + bob, 2, 2);
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.moveTo(px - 6, py - 5 + bob); ctx.lineTo(px - 11, py - 11 + bob); ctx.lineTo(px - 3, py - 3 + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(px + 6, py - 5 + bob); ctx.lineTo(px + 11, py - 11 + bob); ctx.lineTo(px + 3, py - 3 + bob); ctx.fill();
}

function drawOrc(px, py, bob, e) {
  ctx.fillStyle = e.darkColor;
  ctx.beginPath(); ctx.ellipse(px, py + 5 + bob, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.bodyColor;
  ctx.beginPath(); ctx.ellipse(px, py + 4 + bob, 9, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.ellipse(px, py - 5 + bob, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(px - 5, py - 7 + bob, 3, 3);
  ctx.fillRect(px + 2, py - 7 + bob, 3, 3);
  ctx.fillStyle = '#f0e0c0';
  ctx.beginPath(); ctx.moveTo(px - 3, py - 1 + bob); ctx.lineTo(px - 5, py + 5 + bob); ctx.lineTo(px - 1, py - 1 + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(px + 3, py - 1 + bob); ctx.lineTo(px + 5, py + 5 + bob); ctx.lineTo(px + 1, py - 1 + bob); ctx.fill();
}

function drawSkeleton(px, py, bob, e) {
  // Bones body
  ctx.strokeStyle = e.color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py - 2 + bob); ctx.lineTo(px, py + 8 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px - 7, py + 2 + bob); ctx.lineTo(px + 7, py + 2 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, py + 8 + bob); ctx.lineTo(px - 5, py + 16 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, py + 8 + bob); ctx.lineTo(px + 5, py + 16 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px - 7, py + 2 + bob); ctx.lineTo(px - 10, py + 10 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px + 7, py + 2 + bob); ctx.lineTo(px + 10, py + 10 + bob); ctx.stroke();
  // Skull
  ctx.fillStyle = e.bodyColor;
  ctx.beginPath(); ctx.ellipse(px, py - 7 + bob, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.fillRect(px - 4, py - 9 + bob, 3, 3);
  ctx.fillRect(px + 1, py - 9 + bob, 3, 3);
}

function drawMage(px, py, bob, e) {
  // Robe
  ctx.fillStyle = e.darkColor;
  ctx.beginPath(); ctx.moveTo(px - 9, py + 14 + bob); ctx.lineTo(px + 9, py + 14 + bob); ctx.lineTo(px + 6, py - 2 + bob); ctx.lineTo(px - 6, py - 2 + bob); ctx.fill();
  ctx.fillStyle = e.bodyColor;
  ctx.beginPath(); ctx.moveTo(px - 7, py + 12 + bob); ctx.lineTo(px + 7, py + 12 + bob); ctx.lineTo(px + 4, py + 2 + bob); ctx.lineTo(px - 4, py + 2 + bob); ctx.fill();
  // Head
  ctx.fillStyle = '#c8a080';
  ctx.beginPath(); ctx.ellipse(px, py - 7 + bob, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Hat
  ctx.fillStyle = e.darkColor;
  ctx.beginPath(); ctx.moveTo(px - 8, py - 11 + bob); ctx.lineTo(px + 8, py - 11 + bob); ctx.lineTo(px, py - 22 + bob); ctx.fill();
  // Glowing orb
  let orbPulse = 0.7 + 0.3 * Math.sin(animTick * 0.1 + e.wobble);
  ctx.fillStyle = `rgba(150, 80, 255, ${orbPulse})`;
  ctx.beginPath(); ctx.arc(px + 11, py - 4 + bob, 4, 0, Math.PI * 2); ctx.fill();
}

function drawBoss(px, py, bob, e) {
  let t = animTick * 0.05;
  // Aura
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.1*Math.sin(t*2);
  ctx.fillStyle = '#ff2244';
  ctx.beginPath(); ctx.arc(px, py + bob, 18, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  // Body
  ctx.fillStyle = e.darkColor;
  ctx.beginPath(); ctx.ellipse(px, py + 6 + bob, 13, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.bodyColor;
  ctx.beginPath(); ctx.ellipse(px, py + 5 + bob, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.ellipse(px, py - 7 + bob, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Crown
  ctx.fillStyle = '#c9a84c';
  ctx.beginPath(); ctx.moveTo(px - 11, py - 14 + bob); ctx.lineTo(px - 8, py - 20 + bob); ctx.lineTo(px - 3, py - 15 + bob); ctx.lineTo(px, py - 21 + bob); ctx.lineTo(px + 3, py - 15 + bob); ctx.lineTo(px + 8, py - 20 + bob); ctx.lineTo(px + 11, py - 14 + bob); ctx.fill();
  // Eyes glow
  ctx.fillStyle = `rgba(255,255,0,${0.8+0.2*Math.sin(t*3)})`;
  ctx.fillRect(px - 6, py - 10 + bob, 4, 4);
  ctx.fillRect(px + 2, py - 10 + bob, 4, 4);
}

// ==================== PLAYER RENDERING ====================
function drawPlayer() {
  const px = player.x * TS + TS / 2;
  const py = player.y * TS + TS / 2;
  const bob = Math.sin(animTick * 0.08) * 1.5;

  // Shield glow if high def
  if (player.def >= 10) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#4488ff';
    ctx.beginPath(); ctx.arc(px, py + bob, 16, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = '#1a44aa';
  ctx.beginPath();
  ctx.moveTo(px - 8, py - 2 + bob); ctx.lineTo(px - 10, py + 14 + bob);
  ctx.lineTo(px + 10, py + 14 + bob); ctx.lineTo(px + 8, py - 2 + bob);
  ctx.fill();

  ctx.fillStyle = '#778899';
  ctx.beginPath(); ctx.ellipse(px, py + 4 + bob, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aabbcc';
  ctx.beginPath(); ctx.ellipse(px - 2, py + 1 + bob, 4, 5, -0.3, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#f5c890';
  ctx.beginPath(); ctx.ellipse(px, py - 6 + bob, 7, 7, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#556677';
  ctx.beginPath(); ctx.ellipse(px, py - 9 + bob, 7, 5, 0, 0, Math.PI); ctx.fill();
  ctx.fillRect(px - 7, py - 9 + bob, 14, 3);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - 4, py - 7 + bob, 3, 2);
  ctx.fillRect(px + 1, py - 7 + bob, 3, 2);
  ctx.fillStyle = '#2244aa';
  ctx.fillRect(px - 3, py - 7 + bob, 2, 2);
  ctx.fillRect(px + 2, py - 7 + bob, 2, 2);

  ctx.strokeStyle = '#ddddee'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px + 10, py - 4 + bob); ctx.lineTo(px + 18, py - 14 + bob); ctx.stroke();
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px + 6, py - 1 + bob); ctx.lineTo(px + 14, py - 4 + bob); ctx.stroke();

  // Poison effect
  if (player.poisonTurns > 0) {
    ctx.fillStyle = `rgba(80,255,80,${0.4+0.3*Math.sin(animTick*0.2)})`;
    ctx.beginPath(); ctx.arc(px, py+bob, 14, 0, Math.PI*2); ctx.fill();
  }
}

// Atmospheric lighting: torch radius follows the hero; special locations shimmer.
const dungeonLightCanvas = document.createElement('canvas');
dungeonLightCanvas.width = canvas.width;
dungeonLightCanvas.height = canvas.height;
const dungeonLightCtx = dungeonLightCanvas.getContext('2d');
function drawDungeonLighting() {
  if (!player || !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
  const px=(player.x+.5)*TS, py=(player.y+.5)*TS;
  const flicker=Math.sin(animTick*.13)*6+Math.sin(animTick*.37)*3;
  const l=dungeonLightCtx;
  l.globalCompositeOperation='source-over';
  l.clearRect(0,0,canvas.width,canvas.height);
  l.fillStyle='rgba(3,4,11,.80)';
  l.fillRect(0,0,canvas.width,canvas.height);
  l.globalCompositeOperation='destination-out';
  const radius=205+flicker;
  const g=l.createRadialGradient(px,py,20,px,py,radius);
  g.addColorStop(0,'rgba(0,0,0,1)');
  g.addColorStop(.35,'rgba(0,0,0,.97)');
  g.addColorStop(.73,'rgba(0,0,0,.55)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  l.fillStyle=g;
  l.beginPath();l.arc(px,py,radius,0,Math.PI*2);l.fill();
  l.globalCompositeOperation='source-over';
  ctx.drawImage(dungeonLightCanvas,0,0);
  ctx.save();
  const glow=ctx.createRadialGradient(px,py,2,px,py,115);
  glow.addColorStop(0,'rgba(252,176,86,.14)');
  glow.addColorStop(1,'rgba(252,176,86,0)');
  ctx.fillStyle=glow;ctx.fillRect(px-115,py-115,230,230);
  ctx.restore();
}

// ==================== RENDER ====================
function render() {
  ctx.save();
  // Screen shake
  if (screenShake.dur > 0) {
    ctx.translate(screenShake.x, screenShake.y);
    screenShake.x = (Math.random()-0.5)*6;
    screenShake.y = (Math.random()-0.5)*6;
    screenShake.dur--;
    if (screenShake.dur <= 0) { screenShake.x=0; screenShake.y=0; }
  }

  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      drawTile(x, y);
  enemies.forEach(drawEnemy);
  drawPlayer();
  updateParticles();
  drawParticles();
  drawDungeonLighting();
  ctx.restore();
  renderMinimap();
  updateUI();
}

function renderMinimap() {
  const mw = miniCanvas.width, mh = miniCanvas.height;
  const tw = mw / COLS, th = mh / ROWS;
  mCtx.fillStyle = '#050403';
  mCtx.fillRect(0, 0, mw, mh);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = dungeon[y][x];
      if (t === 0) continue;
      if      (t === 2) mCtx.fillStyle = '#cc44ff';
      else if (t === 4) mCtx.fillStyle = '#c9a84c';
      else if (t === 5) mCtx.fillStyle = '#aa66ff';
      else if (t === 6) mCtx.fillStyle = '#c9a84c';
      else if (t === 7) mCtx.fillStyle = '#4488ff';
      else if (t === 3) mCtx.fillStyle = '#2a2040';
      else              mCtx.fillStyle = '#3a3020';
      mCtx.fillRect(x * tw, y * th, tw, th);
    }
  }
  enemies.forEach(e => {
    mCtx.fillStyle = e.isBoss ? '#ff2244' : e.symbol === 'g' ? '#3dba4e' : e.symbol === 's' ? '#e8e0c8' : e.symbol === 'm' ? '#8844cc' : '#d4701a';
    mCtx.fillRect(e.x * tw, e.y * th, tw, th);
  });
  mCtx.fillStyle = '#f0d060';
  mCtx.fillRect(player.x * tw - 1, player.y * th - 1, tw + 2, th + 2);
}

function updateUI() {
  document.getElementById('ui-hp').textContent    = player.hp;
  document.getElementById('ui-maxhp').textContent = player.maxhp;
  document.getElementById('ui-level').textContent = player.level;
  document.getElementById('ui-xp').textContent    = player.xp;
  document.getElementById('ui-xpto').textContent  = player.xpToLevel;
  document.getElementById('ui-atk').textContent   = player.atk;
  document.getElementById('ui-def').textContent   = player.def;
  document.getElementById('hp-bar').style.width   = Math.max(0, player.hp / player.maxhp * 100) + '%';
  document.getElementById('xp-bar').style.width   = (player.xp / player.xpToLevel * 100) + '%';
  document.getElementById('message-box').textContent = message;
  let dungEl = document.getElementById('ui-dungeon');
  if (dungEl) dungEl.textContent = dungeonLevel;
  let poisEl = document.getElementById('ui-poison');
  if (poisEl) poisEl.textContent = player.poisonTurns > 0 ? `☠ Empoisonné (${player.poisonTurns})` : '';
}

// ==================== GAME LOOP ====================
function gameLoop() {
  animTick++;
  render();
  requestAnimationFrame(gameLoop);
}

// ==================== MOVEMENT ====================
function move(dx, dy) {
  if (combat || inputCooldown) return;
  let nx = player.x + dx, ny = player.y + dy;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
  if (dungeon[ny][nx] === 0) { message = "Mur !"; return; }

  let targetEnemy = enemies.find(e => e.x === nx && e.y === ny);
  if (targetEnemy) { startCombat(targetEnemy); return; }

  player.x = nx; player.y = ny;
  const tile = dungeon[ny][nx];

  if (tile === 4) {
    dungeon[ny][nx] = 1;
    let heal = 8 + Math.floor(Math.random() * 8);
    player.hp = Math.min(player.maxhp, player.hp + heal);
    spawnParticles(nx, ny, '#c9a84c', 8, 'spark');
    spawnFloatingText(nx, ny, `+${heal} PV`, '#c9a84c');
    message = `💰 Coffre ! +${heal} PV`;
  } else if (tile === 5) {
    dungeon[ny][nx] = 1;
    // Rare chest: random reward
    let roll = Math.random();
    if (roll < 0.4) {
      let heal = Math.floor(player.maxhp * 0.4);
      player.hp = Math.min(player.maxhp, player.hp + heal);
      spawnParticles(nx, ny, '#aa66ff', 12, 'xp');
      spawnFloatingText(nx, ny, `+${heal} PV`, '#aa66ff');
      message = `💎 Coffre rare ! Grande potion +${heal} PV !`;
    } else if (roll < 0.7) {
      player.atk += 2;
      spawnParticles(nx, ny, '#ffdd44', 10, 'spark');
      spawnFloatingText(nx, ny, '+2 ATK', '#ffdd44');
      message = `💎 Coffre rare ! +2 ATK !`;
    } else {
      player.def += 1;
      spawnParticles(nx, ny, '#44aaff', 10, 'spark');
      spawnFloatingText(nx, ny, '+1 DEF', '#44aaff');
      message = `💎 Coffre rare ! +1 DEF !`;
    }
  } else if (tile === 6) {
    // Armory
    dungeon[ny][nx] = 3;
    player.atk += 3;
    spawnParticles(nx, ny, '#c9a84c', 15, 'spark');
    spawnFloatingText(nx, ny, '+3 ATK', '#c9a84c');
    message = `⚔️ Armurerie ! +3 ATK !`;
  } else if (tile === 7) {
    // Library
    dungeon[ny][nx] = 3;
    player.maxhp += 10;
    player.hp = Math.min(player.maxhp, player.hp + 10);
    spawnParticles(nx, ny, '#4488ff', 15, 'xp');
    spawnFloatingText(nx, ny, '+10 PV max', '#4488ff');
    message = `📖 Bibliothèque ! +10 PV maximum !`;
  } else if (tile === 2) {
    dungeonLevel++;
    let res = gainXp(30 * player.level);
    spawnParticles(nx, ny, '#cc44ff', 20, 'xp');
    message = `🏆 Niveau ${dungeonLevel} ! ${res.levelsGained ? `+${res.levelsGained} niveau${res.levelsGained>1?'x':''} !` : `+${res.xpGained} XP`}`;
    generateDungeon();
    return;
  } else {
    message = "…";
  }

  // Poison tick
  if (player.poisonTurns > 0) {
    let poisonDmg = Math.ceil(player.maxhp * 0.04);
    player.hp -= poisonDmg;
    player.poisonTurns--;
    spawnFloatingText(player.x, player.y, `-${poisonDmg} poison`, '#80ff80');
    if (player.hp <= 0) { player.hp = 0; showDeathScreen(); return; }
  }

  inputCooldown = true;
  setTimeout(() => { inputCooldown = false; }, 80);
}

// ==================== XP / LEVEL ====================
function gainXp(amount) {
  let levelsGained = 0;
  player.xp += amount;
  while (player.xp >= player.xpToLevel) {
    player.xp -= player.xpToLevel;
    player.level++;
    player.xpToLevel = Math.floor(player.xpToLevel * 1.5);
    player.atk  += 3;
    player.def  += 2;
    player.maxhp += 15;
    player.hp = player.maxhp;
    levelsGained++;
    // Passive skill at milestone levels
    if (player.level % 3 === 0) grantPassive();
  }
  return {levelsGained, xpGained: amount};
}

function grantPassive() {
  let passives = [
    { effect: () => { player.atk += 2; }, msg: '⚡ Maîtrise de l\'arme : +2 ATK permanent !' },
    { effect: () => { player.def += 2; }, msg: '🛡 Peau d\'acier : +2 DEF permanent !' },
    { effect: () => { player.maxhp += 20; player.hp += 20; }, msg: '❤ Vitalité : +20 PV max !' },
    { effect: () => { player.critChance = (player.critChance||0.05) + 0.05; }, msg: '🎯 Œil vif : +5% chances de critique !' }
  ];
  let p = passives[Math.floor(Math.random() * passives.length)];
  p.effect();
  showNotification(p.msg);
}

function showNotification(msg) {
  let notif = document.getElementById('level-notif');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'level-notif';
    document.getElementById('game-wrapper').appendChild(notif);
  }
  notif.textContent = msg;
  notif.style.cssText = `
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    background:#110e0a; border:2px solid #c9a84c; color:#f0d080;
    font-family:'Cinzel',serif; font-size:1.1em; padding:20px 32px;
    border-radius:6px; z-index:200; text-align:center;
    box-shadow:0 0 40px #c9a84c55;
    animation: fadeNotif 2.5s forwards;
  `;
  clearTimeout(notif._timeout);
  notif._timeout = setTimeout(() => notif.remove(), 2500);
}

// ==================== DEATH SCREEN ====================
function showDeathScreen() {
  let overlay = document.getElementById('combat-overlay');
  overlay.classList.remove('active');
  combat = null;

  let death = document.getElementById('death-screen');
  if (!death) {
    death = document.createElement('div');
    death.id = 'death-screen';
    document.body.appendChild(death);
  }
  death.innerHTML = `
    <div id="death-window">
      <h2>💀 TU ES MORT</h2>
      <p>Niveau atteint : <strong>${player.level}</strong></p>
      <p>Donjon : <strong>${dungeonLevel}</strong></p>
      <p>Ennemis vaincus : <strong>${player.kills || 0}</strong></p>
      <button id="btn-restart">⚔ Recommencer</button>
    </div>
  `;
  death.style.display = 'flex';
  document.getElementById('btn-restart').addEventListener('click', () => {
    death.style.display = 'none';
    dungeonLevel = 1;
    initGame();
  });
}

// ==================== COMBAT ====================
function startCombat(enemy) {
  combat = {enemy, log: [], turn: 'player', guarding: false};
  addLog(`⚔️ ${enemy.isBoss ? '💀 BOSS ! ' : ''}Combat ! À toi d'attaquer.`);
  document.getElementById('combat-overlay').classList.add('active');
  document.getElementById('btn-attack').disabled = false;
  document.getElementById('btn-guard').disabled = false;
  document.getElementById('btn-flee').disabled = false;
  updateCombatUI();
}

function endCombat() {
  document.getElementById('combat-overlay').classList.remove('active');
  combat = null;
  message = "⚔️ Combat terminé.";
}

function addLog(msg) {
  combat.log.push(msg);
  if (combat.log.length > 10) combat.log.shift();
  document.getElementById('combat-log').innerHTML =
    combat.log.map(l => `<div class="log-entry">${l}</div>`).join('');
  let logEl = document.getElementById('combat-log');
  logEl.scrollTop = logEl.scrollHeight;
}

function updateCombatUI() {
  let p = player, e = combat.enemy;
  document.getElementById('c-plevel').textContent = p.level;
  document.getElementById('c-php').textContent    = p.hp;
  document.getElementById('c-pmaxhp').textContent = p.maxhp;
  document.getElementById('c-patk').textContent   = p.atk;
  document.getElementById('c-pdef').textContent   = p.def;
  document.getElementById('c-ename').textContent  = e.isBoss ? `👑 ${e.name}` : e.name;
  document.getElementById('c-ehp').textContent    = e.hp;
  document.getElementById('c-emaxhp').textContent = e.maxhp;
  document.getElementById('c-eatk').textContent   = e.atk;
  document.getElementById('c-edef').textContent   = e.def;
  document.getElementById('c-pbar').style.width   = Math.max(0, p.hp / p.maxhp * 100) + '%';
  document.getElementById('c-ebar').style.width   = Math.max(0, e.hp / e.maxhp * 100) + '%';
}

// Short combat animations, restarted on each action without affecting turn timing.
function animateCombat(side, effect) {
  const panel = document.querySelector(side === 'player' ? '.fighter-card:first-child' : '.fighter-card:last-child');
  const windowEl = document.getElementById('combat-window');
  if (!panel || !windowEl) return;
  panel.classList.remove('combat-strike', 'combat-hit', 'combat-guard', 'combat-critical', 'combat-spell');
  void panel.offsetWidth;
  panel.classList.add(effect);
  windowEl.classList.toggle('combat-impact', effect === 'combat-critical');
  setTimeout(() => {
    panel.classList.remove(effect);
    windowEl.classList.remove('combat-impact');
  }, 520);
}

function guardHandler() {
  if (!combat || combat.turn !== 'player') return;
  combat.turn = 'resolving';
  combat.guarding = true;
  animateCombat('player', 'combat-guard');
  addLog('🛡 Tu prends une posture défensive : prochains dégâts réduits de 60 %.');
  document.getElementById('btn-attack').disabled = true;
  document.getElementById('btn-guard').disabled = true;
  document.getElementById('btn-flee').disabled = true;
  setTimeout(enemyAttack, 650);
}

function attackHandler() {
  if (!combat || combat.turn !== 'player') return;
  combat.turn = 'resolving';

  // Crit
  let isCrit = Math.random() < (player.critChance || 0.05);
  let baseDmg = Math.max(1, player.atk - combat.enemy.def + Math.floor(Math.random() * 4) - 1);
  let dmg = isCrit ? Math.floor(baseDmg * 2) : baseDmg;
  if (combat.enemy.rageActive) dmg = Math.floor(dmg * 0.8); // rage also raises def

  combat.enemy.hp -= dmg;
  animateCombat('enemy', isCrit ? 'combat-critical' : 'combat-hit');
  spawnParticles(combat.enemy.x, combat.enemy.y, '#cc2222', isCrit ? 12 : 6, 'blood');
  spawnFloatingText(combat.enemy.x, combat.enemy.y, isCrit ? `💥 CRIT! -${dmg}` : `-${dmg}`, isCrit ? '#ffdd44' : '#ff4444');
  addLog(isCrit ? `💥 Coup critique ! ${dmg} dégâts à ${combat.enemy.name} !` : `🗡️ Tu infliges ${dmg} dégâts à ${combat.enemy.name} !`);
  updateCombatUI();

  if (combat.enemy.hp <= 0) {
    player.kills = (player.kills || 0) + 1;
    let res = gainXp(combat.enemy.xp);
    spawnParticles(combat.enemy.x, combat.enemy.y, '#c9a84c', 15, 'xp');
    addLog(res.levelsGained ? `🎉 Niveau ${player.level} ! Compétence gagnée !` : `✨ +${res.xpGained} XP`);
    dungeon[combat.enemy.y][combat.enemy.x] = Math.random() < 0.25 ? 5 : 4;
    enemies = enemies.filter(e => e !== combat.enemy);
    addLog(`💀 ${combat.enemy.name} vaincu !`);
    if (combat.enemy.isBoss) addLog('🏆 BOSS VAINCU ! Gloire éternelle !');
    setTimeout(endCombat, 1500);
    return;
  }

  document.getElementById('btn-attack').disabled = true;
  document.getElementById('btn-guard').disabled = true;
  document.getElementById('btn-flee').disabled   = true;
  setTimeout(enemyAttack, 1000);
}

function enemyAttack() {
  if (!combat) return;
  let e = combat.enemy;

  // Rage trigger at 50% HP
  if (e.skills.includes('rage') && !e.rageActive && e.hp <= e.maxhp * 0.5) {
    e.rageActive = true;
    e.atk = Math.floor(e.atk * 1.4);
    addLog(`😡 ${e.name} entre en RAGE ! ATK augmentée !`);
  }

  // Skeleton undying: once per fight, survive at 1 HP
  if (e.skills.includes('undying') && !e.usedUndying && e.hp <= 0) {
    e.usedUndying = true;
    e.hp = 1;
    addLog(`💀 ${e.name} refuse de mourir... 1 PV restant !`);
  }

  // Mage spellcast: chance to cast a spell instead of normal attack
  let spellCast = e.skills.includes('spellcast') && Math.random() < 0.35;
  let dmg;
  if (spellCast) {
    dmg = Math.max(2, Math.floor(e.atk * 1.5) - Math.floor(player.def * 0.5) + Math.floor(Math.random() * 4));
    addLog(`🔮 ${e.name} lance un sort ! ${dmg} dégâts magiques !`);
  } else {
    dmg = Math.max(1, e.atk - player.def + Math.floor(Math.random() * 3) - 1);
    addLog(`🔴 ${e.name} t'inflige ${dmg} dégâts !`);
  }

  const wasGuarding = combat.guarding;
  if (combat.guarding) {
    animateCombat('player', 'combat-guard');
    const blocked = Math.max(0, dmg - Math.max(1, Math.ceil(dmg * 0.4)));
    dmg -= blocked;
    combat.guarding = false;
    addLog('🛡 Parade : ' + blocked + ' dégâts absorbés !');
    spawnFloatingText(player.x, player.y, '🛡 -' + blocked, '#68cfff');
  }

  // Goblin poison
  if (e.skills.includes('poison') && Math.random() < 0.2) {
    player.poisonTurns += 3;
    addLog(`☠️ Tu es empoisonné ! (${player.poisonTurns} tours)`);
  }

  player.hp -= dmg;
  if (!wasGuarding) animateCombat('player', spellCast ? 'combat-spell' : 'combat-hit');
  spawnParticles(player.x, player.y, '#883333', 6, 'blood');
  spawnFloatingText(player.x, player.y, `-${dmg}`, '#ff4444');
  screenShake.dur = 6; screenShake.x = 4; screenShake.y = 0;
  updateCombatUI();

  document.getElementById('btn-attack').disabled = false;
  document.getElementById('btn-guard').disabled = false;
  document.getElementById('btn-flee').disabled   = false;
  combat.turn = 'player';

  if (player.hp <= 0) {
    player.hp = 0;
    addLog("💀 Tu es mort...");
    document.getElementById('btn-attack').disabled = true;
    document.getElementById('btn-guard').disabled = true;
    document.getElementById('btn-flee').disabled   = true;
    setTimeout(() => { endCombat(); showDeathScreen(); }, 2000);
  }
}

function fleeHandler() {
  if (!combat || combat.turn !== 'player') return;
  let fleeChance = combat.enemy.isBoss ? 0.25 : 0.7;
  if (Math.random() < fleeChance) {
    addLog("🏃 Tu t'enfuis !");
    setTimeout(endCombat, 800);
  } else {
    addLog(`❌ Fuite ratée !${combat.enemy.isBoss ? ' Le boss bloque ta retraite !' : ''}`);
    document.getElementById('btn-attack').disabled = true;
    document.getElementById('btn-flee').disabled   = true;
    combat.turn = 'resolving';
    setTimeout(enemyAttack, 800);
  }
}

// ==================== CONTROLS ====================
window.addEventListener('keydown', e => {
  if (combat) return;
  switch (e.key.toLowerCase()) {
    case 'arrowup':    case 'z': move(0, -1);  e.preventDefault(); break;
    case 'arrowdown':  case 's': move(0,  1);  e.preventDefault(); break;
    case 'arrowleft':  case 'q': move(-1, 0);  e.preventDefault(); break;
    case 'arrowright': case 'd': move(1,  0);  e.preventDefault(); break;
  }
});

// ==================== INIT ====================
function initGame() {
  Object.assign(player, {
    hp: 30, maxhp: 30, atk: 7, def: 3,
    level: 1, xp: 0, xpToLevel: 100,
    critChance: 0.05, poisonTurns: 0, kills: 0
  });
  dungeonLevel = 1;
  generateDungeon();
  combat = null;
  message = "🗡️ Prêt pour l'aventure !";
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-attack').addEventListener('click', attackHandler);
  document.getElementById('btn-guard').addEventListener('click', guardHandler);
  document.getElementById('btn-flee').addEventListener('click', fleeHandler);
  document.getElementById('btn-new-dungeon').addEventListener('click', () => {
    generateDungeon();
    message = "🗺️ Nouveau donjon !";
  });

  // Add style for notif animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeNotif {
      0%   { opacity:0; transform:translate(-50%,-60%); }
      15%  { opacity:1; transform:translate(-50%,-50%); }
      75%  { opacity:1; transform:translate(-50%,-50%); }
      100% { opacity:0; transform:translate(-50%,-40%); }
    }
    #death-screen {
      display:none; position:fixed; inset:0;
      background:rgba(0,0,0,0.92); z-index:300;
      align-items:center; justify-content:center;
    }
    #death-window {
      background:#110e0a; border:2px solid #880000;
      border-radius:8px; padding:36px 48px;
      text-align:center; color:#d4b896;
      font-family:'Cinzel',serif;
      box-shadow:0 0 60px #cc000066;
    }
    #death-window h2 {
      font-family:'Cinzel Decorative',serif;
      color:#ff4444; font-size:2em; letter-spacing:4px;
      margin-bottom:20px; text-shadow:0 0 20px #ff000088;
    }
    #death-window p { margin:8px 0; font-size:0.9em; color:#a08060; }
    #death-window strong { color:#e8d0a0; }
    #death-window button {
      margin-top:24px; width:auto; padding:12px 32px;
      font-size:0.9em;
    }
    #ui-poison { color:#80ff80; font-size:0.65em; text-align:center; margin-top:-4px; min-height:14px; }
  `;
  document.head.appendChild(style);

  initGame();
  gameLoop();
});

// ==================== MAIN MENU ====================
(function() {
  const menuEl    = document.getElementById('main-menu');
  const menuCv    = document.getElementById('menu-canvas');
  const mctx      = menuCv.getContext('2d');
  const btnPlay   = document.getElementById('btn-play');
  const btnHow    = document.getElementById('btn-how');
  const btnClose  = document.getElementById('btn-howto-close');
  const howto     = document.getElementById('howto-panel');
  const gameWrap  = document.getElementById('game-wrapper');
  const gameTitle = document.getElementById('game-title');

  // Resize canvas to window
  function resizeMenu() {
    menuCv.width  = window.innerWidth;
    menuCv.height = window.innerHeight;
  }
  resizeMenu();
  window.addEventListener('resize', resizeMenu);

  // Animated background: drifting particles + dungeon grid
  const stars = Array.from({length: 120}, () => ({
    x: Math.random(), y: Math.random(),
    size: 0.5 + Math.random() * 2,
    speed: 0.00008 + Math.random() * 0.00015,
    color: Math.random() < 0.3 ? '#c9a84c' : '#3a3020',
    alpha: 0.2 + Math.random() * 0.6
  }));

  // Floating sword silhouettes
  const swords = Array.from({length: 5}, () => ({
    x: Math.random(),
    y: Math.random(),
    angle: Math.random() * Math.PI * 2,
    speed: 0.0002 + Math.random() * 0.0003,
    rotSpeed: (Math.random()-0.5) * 0.002,
    alpha: 0.03 + Math.random() * 0.06,
    size: 40 + Math.random() * 60
  }));

  let menuTick = 0;
  let menuRunning = true;

  function drawMenuBg() {
    const W = menuCv.width, H = menuCv.height;
    menuTick++;

    // Background
    mctx.fillStyle = '#050302';
    mctx.fillRect(0, 0, W, H);

    // Grid overlay
    mctx.strokeStyle = 'rgba(60,40,20,0.18)';
    mctx.lineWidth = 1;
    const gs = 40;
    for (let x = 0; x < W; x += gs) { mctx.beginPath(); mctx.moveTo(x,0); mctx.lineTo(x,H); mctx.stroke(); }
    for (let y = 0; y < H; y += gs) { mctx.beginPath(); mctx.moveTo(0,y); mctx.lineTo(W,y); mctx.stroke(); }

    // Radial vignette glow center
    let grad = mctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.6);
    grad.addColorStop(0, 'rgba(100,60,10,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = grad;
    mctx.fillRect(0, 0, W, H);

    // Sword silhouettes
    swords.forEach(s => {
      s.y -= s.speed;
      s.angle += s.rotSpeed;
      if (s.y < -0.1) { s.y = 1.1; s.x = Math.random(); }
      mctx.save();
      mctx.globalAlpha = s.alpha;
      mctx.translate(s.x * W, s.y * H);
      mctx.rotate(s.angle);
      mctx.fillStyle = '#c9a84c';
      mctx.font = `${s.size}px serif`;
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillText('⚔', 0, 0);
      mctx.restore();
    });

    // Stars / particles
    stars.forEach(st => {
      st.y -= st.speed;
      if (st.y < 0) { st.y = 1; st.x = Math.random(); }
      let pulse = st.alpha * (0.7 + 0.3 * Math.sin(menuTick * 0.03 + st.x * 10));
      mctx.globalAlpha = pulse;
      mctx.fillStyle = st.color;
      mctx.fillRect(st.x * W, st.y * H, st.size, st.size);
    });
    mctx.globalAlpha = 1;

    // Bottom fog
    let fog = mctx.createLinearGradient(0, H*0.7, 0, H);
    fog.addColorStop(0, 'rgba(5,3,2,0)');
    fog.addColorStop(1, 'rgba(5,3,2,0.85)');
    mctx.fillStyle = fog;
    mctx.fillRect(0, 0, W, H);

    // Top fog
    let fog2 = mctx.createLinearGradient(0, 0, 0, H*0.18);
    fog2.addColorStop(0, 'rgba(5,3,2,0.7)');
    fog2.addColorStop(1, 'rgba(5,3,2,0)');
    mctx.fillStyle = fog2;
    mctx.fillRect(0, 0, W, H);

    if (menuRunning) requestAnimationFrame(drawMenuBg);
  }

  drawMenuBg();

  function startGame() {
    menuRunning = false;
    menuEl.classList.add('fade-out');
    setTimeout(() => {
      menuEl.style.display = 'none';
      gameWrap.style.display = 'flex';
      if (gameTitle) gameTitle.style.display = '';
    }, 600);
  }

  btnPlay.addEventListener('click', startGame);
  btnHow.addEventListener('click', () => { howto.classList.add('active'); });
  btnClose.addEventListener('click', () => { howto.classList.remove('active'); startGame(); });
})();