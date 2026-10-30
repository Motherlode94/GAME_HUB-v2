// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Game Engine
//  Touch + Desktop · Pinch-to-zoom · Mobile-first UX
// ═══════════════════════════════════════════════════════

// ── BUILDING DATA ──
const GRID = 30;

const BUILDINGS = {
  road:     { cost: 10,   emoji: '',    label: 'Route',         pN: 0, wN: 0, pop: 0,      income: 0,  upkeep: 0,  happy: 0,  pG: 0,  wG: 0  },
  house:    { cost: 100,  emoji: '🏠', label: 'Maison',        pN: 1, wN: 1, pop: [3,8],  income: 5,  upkeep: 1,  happy: 0,  pG: 0,  wG: 0  },
  shop:     { cost: 200,  emoji: '🏪', label: 'Commerce',      pN: 2, wN: 1, pop: [1,3],  income: 12, upkeep: 3,  happy: 2,  pG: 0,  wG: 0  },
  office:   { cost: 350,  emoji: '🏢', label: 'Bureau',        pN: 3, wN: 1, pop: [2,6],  income: 18, upkeep: 5,  happy: 0,  pG: 0,  wG: 0  },
  park:     { cost: 80,   emoji: '🌳', label: 'Parc',          pN: 0, wN: 1, pop: 0,      income: 0,  upkeep: 1,  happy: 5,  pG: 0,  wG: 0  },
  power:    { cost: 500,  emoji: '⚡', label: 'Centrale',      pN: 0, wN: 0, pop: 0,      income: 0,  upkeep: 8,  happy: -3, pG: 20, wG: 0  },
  water:    { cost: 300,  emoji: '💧', label: "Château d'eau", pN: 1, wN: 0, pop: 0,      income: 0,  upkeep: 5,  happy: 0,  pG: 0,  wG: 15 },
  fire:     { cost: 400,  emoji: '🚒', label: 'Pompiers',      pN: 2, wN: 2, pop: 0,      income: 0,  upkeep: 6,  happy: 4,  pG: 0,  wG: 0  },
  police:   { cost: 400,  emoji: '🚔', label: 'Police',        pN: 2, wN: 1, pop: 0,      income: 0,  upkeep: 6,  happy: 4,  pG: 0,  wG: 0  },
  school:   { cost: 600,  emoji: '🏫', label: 'École',         pN: 3, wN: 2, pop: 0,      income: 0,  upkeep: 8,  happy: 6,  pG: 0,  wG: 0  },
  // ── Bâtiments avancés (depuis events.js) ──
  hospital: { cost: 800,  emoji: '🏥', label: 'Hôpital',       pN: 4, wN: 3, pop: 0,      income: 0,  upkeep: 10, happy: 8,  pG: 0,  wG: 0  },
  stadium:  { cost: 1200, emoji: '🏟️', label: 'Stade',         pN: 5, wN: 2, pop: 0,      income: 20, upkeep: 12, happy: 10, pG: 0,  wG: 0  },
  market:   { cost: 450,  emoji: '🏬', label: 'Marché',        pN: 2, wN: 1, pop: [1,4],  income: 16, upkeep: 4,  happy: 4,  pG: 0,  wG: 0  },
  factory:  { cost: 700,  emoji: '🏭', label: 'Usine',         pN: 5, wN: 2, pop: [2,5],  income: 25, upkeep: 8,  happy: -5, pG: 0,  wG: 0  },
  solar:    { cost: 900,  emoji: '☀️', label: 'Solaire',       pN: 0, wN: 0, pop: 0,      income: 0,  upkeep: 3,  happy: 2,  pG: 15, wG: 0  },
  windmill: { cost: 600,  emoji: '💨', label: 'Éolienne',      pN: 0, wN: 0, pop: 0,      income: 0,  upkeep: 2,  happy: 1,  pG: 10, wG: 0  },
  library:  { cost: 500,  emoji: '📚', label: 'Bibliothèque',  pN: 2, wN: 1, pop: 0,      income: 0,  upkeep: 5,  happy: 7,  pG: 0,  wG: 0  },
  airport:  { cost: 2000, emoji: '✈️', label: 'Aéroport',      pN: 8, wN: 4, pop: [5,15], income: 40, upkeep: 20, happy: 3,  pG: 0,  wG: 0  },
};

// ── GAME STATE ──
let budget = 10000;
let population = 0;
let satisfaction = 50;
// Choix du maire : arbitrage entre niveau de vie et recettes fiscales.
const CITY_POLICIES = {
  social: {name:'Ville solidaire', tax:0.55, happy:12, desc:'Impôts réduits, habitants plus heureux.'},
  balanced: {name:'Gestion équilibrée', tax:1, happy:0, desc:'Recettes et satisfaction stables.'},
  growth: {name:'Développement intensif', tax:1.8, happy:-13, desc:'Recettes accrues mais mécontentement.'}
};
let cityPolicy = 'balanced';
try { const savedPolicy = localStorage.getItem('warlike-city-policy'); if (CITY_POLICIES[savedPolicy]) cityPolicy = savedPolicy; } catch (_) {}

let tool = 'road';
let speed = 1;
let tick = 0;
let gameStarted = false;
const grid = [];

// Resource cache
let res = { pG:0, pN:0, wG:0, wN:0, income:0, upkeep:0, buildings:0, roads:0 };

// ── DOM ──
const mapEl        = document.getElementById('map');
const viewport     = document.getElementById('viewport');
const mapContainer = document.getElementById('map-container');
const tooltipEl    = document.getElementById('tooltip');
const notifBox     = document.getElementById('notif-container');

// ═══════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════
let camX = 0, camY = 0, zoom = 1;
let isDragging = false;
let dragStartX, dragStartY, camStartX, camStartY;
let dragMoved = false;

function centerCamera() {
  const mapPx = GRID * 45 + 160;
  camX = -(mapPx / 2 - viewport.clientWidth / 2);
  camY = -(mapPx / 2 - viewport.clientHeight / 2);
  applyCamera();
}

function applyCamera() {
  mapContainer.style.transform = `translate(${camX}px,${camY}px) scale(${zoom})`;
}

// ── Mouse pan ──
viewport.addEventListener('mousedown', e => {
  if (e.button === 0 && (e.target === viewport || e.target === mapEl)) {
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  }
  if (e.button === 1 || e.button === 2) {
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  }
});
window.addEventListener('mousemove', e => {
  if (isDragging) moveDrag(e.clientX, e.clientY);
  // tooltip position
  if (tooltipEl) {
    tooltipEl.style.left = (e.clientX + 14) + 'px';
    tooltipEl.style.top  = (e.clientY + 14) + 'px';
  }
});
window.addEventListener('mouseup', endDrag);
viewport.addEventListener('contextmenu', e => e.preventDefault());

// ── Mouse zoom ──
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const d = e.deltaY > 0 ? -0.07 : 0.07;
  zoom = clamp(zoom + d, 0.3, 3);
  applyCamera();
}, { passive: false });

// ── Touch: pan + pinch-to-zoom ──
let touches = {};
let pinchStartDist = 0;
let pinchStartZoom = 1;

viewport.addEventListener('touchstart', e => {
  const t = e.touches;
  if (t.length === 1) {
    startDrag(t[0].clientX, t[0].clientY);
  }
  if (t.length === 2) {
    isDragging = false;
    pinchStartDist = touchDist(t[0], t[1]);
    pinchStartZoom = zoom;
  }
}, { passive: false });

viewport.addEventListener('touchmove', e => {
  e.preventDefault();
  const t = e.touches;
  if (t.length === 1 && isDragging) {
    moveDrag(t[0].clientX, t[0].clientY);
  }
  if (t.length === 2) {
    const dist = touchDist(t[0], t[1]);
    zoom = clamp(pinchStartZoom * (dist / pinchStartDist), 0.3, 3);
    applyCamera();
  }
}, { passive: false });

viewport.addEventListener('touchend', e => {
  if (e.touches.length === 0) endDrag();
});

function startDrag(x, y) {
  isDragging = true; dragMoved = false;
  dragStartX = x; dragStartY = y;
  camStartX = camX; camStartY = camY;
  viewport.classList.add('dragging');
}
function moveDrag(x, y) {
  const dx = x - dragStartX, dy = y - dragStartY;
  if (Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true;
  camX = camStartX + dx;
  camY = camStartY + dy;
  applyCamera();
}
function endDrag() {
  isDragging = false;
  viewport.classList.remove('dragging');
}
function touchDist(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ═══════════════════════════════════════
//  WELCOME & START
// ═══════════════════════════════════════
function startGame() {
  document.getElementById('welcome').classList.add('hidden');
  gameStarted = true;
  centerCamera();
}

// ═══════════════════════════════════════
//  TOOLS
// ═══════════════════════════════════════
function selectTool(t, btn) {
  tool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    const el = document.querySelector(`.tool-btn[data-tool="${t}"]`);
    if (el) el.classList.add('active');
  }
  updateToolAffordability();
  const policyInfo = document.getElementById('city-policy-status');
  if (policyInfo) policyInfo.textContent = CITY_POLICIES[cityPolicy].name + ' · Fiscalité x' + CITY_POLICIES[cityPolicy].tax + ' · Satisfaction ' + (CITY_POLICIES[cityPolicy].happy >= 0 ? '+' : '') + CITY_POLICIES[cityPolicy].happy;
}

// Keyboard shortcuts
window.addEventListener('keydown', e => {
  const map = { '1':'road','2':'house','3':'shop','4':'office','5':'park',
                '6':'power','7':'water','8':'fire','9':'police','0':'school','d':'demolish','D':'demolish' };
  if (map[e.key]) selectTool(map[e.key]);
});

function updateToolAffordability() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    const t = btn.dataset.tool;
    if (t === 'demolish') return;
    const b = BUILDINGS[t];
    if (b) btn.classList.toggle('disabled', budget < b.cost);
  });
}

// ═══════════════════════════════════════
//  MAP CREATION
// ═══════════════════════════════════════
let mouseDown = false;

function createMap() {
  for (let y = 0; y < GRID; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID; x++) {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.dataset.x = x;
      tile.dataset.y = y;
      grid[y][x] = { type: null, el: tile, x, y, pop: 0 };

      // ── Desktop click ──
      tile.addEventListener('mousedown', e => {
        if (e.button === 0) {
          mouseDown = true;
          window.buildAt(x, y);
        }
      });
      tile.addEventListener('mouseenter', () => {
        if (mouseDown && (tool === 'road' || tool === 'demolish')) window.buildAt(x, y);
        window.showTooltip(x, y);
      });
      tile.addEventListener('mouseleave', () => window.hideTooltip());

      // ── Touch tap to build ──
      tile.addEventListener('touchstart', e => {
        // store touch position to detect tap vs drag
        tile._touchX = e.touches[0].clientX;
        tile._touchY = e.touches[0].clientY;
      }, { passive: true });

      tile.addEventListener('touchend', e => {
        if (!tile._touchX) return;
        const ch = e.changedTouches[0];
        const dist = Math.abs(ch.clientX - tile._touchX) + Math.abs(ch.clientY - tile._touchY);
        if (dist < 20) {
          // it was a tap, not a drag
          e.preventDefault();
          window.buildAt(x, y);
        }
        tile._touchX = null;
      });

      mapEl.appendChild(tile);
    }
  }
  window.addEventListener('mouseup', () => { mouseDown = false; });
  window.buildAt = buildAt;
}

// ═══════════════════════════════════════
//  BUILD / DEMOLISH
// ═══════════════════════════════════════
function buildAt(x, y) {
  const cell = grid[y][x];

  // Demolish
  if (tool === 'demolish') {
    if (!cell.type) return;
    const b = BUILDINGS[cell.type];
    if (cell.pop > 0) {
      population = Math.max(0, population - cell.pop);
      cell.pop = 0;
    }
    cell.type = null;
    cell.el.className = 'tile';
    cell.el.innerHTML = '';
    recalcResources();
    updateUI();
    updateMinimap();
    return;
  }

  // Can't overbuild
  if (cell.type) return;

  const info = BUILDINGS[tool];
  if (!info) return;

  // Budget
  if (budget < info.cost) {
    notify('💰 Budget insuffisant !');
    return;
  }

  // Road adjacency (not for first build or roads)
  if (tool !== 'road' && countType() > 0 && !hasAdjacentRoad(x, y)) {
    notify('🛣️ Doit être adjacent à une route !');
    return;
  }

  // Build!
  budget -= info.cost;
  cell.type = tool;
  cell.el.classList.add(tool, 'just-built');
  setTimeout(() => cell.el.classList.remove('just-built'), 400);

  if (info.emoji) {
    cell.el.innerHTML = `<span class="emoji" style="font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',serif">${info.emoji}</span>`;
  } else if (tool === 'road') {
    cell.el.innerHTML = '<span class="emoji">─</span>';
  }

  // Population
  if (info.pop && Array.isArray(info.pop)) {
    const p = randInt(info.pop[0], info.pop[1]);
    cell.pop = p;
    population += p;
  }

  recalcResources();
  updateUI();
  updateMinimap();
}

function hasAdjacentRoad(x, y) {
  return [[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy]) => {
    const nx = x+dx, ny = y+dy;
    return nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && grid[ny][nx].type === 'road';
  });
}

function countType() {
  let c = 0;
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (grid[y][x].type) c++;
  return c;
}
window.countType = countType;

function countBuildingType(type) {
  let count = 0;
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (grid[y][x].type === type) count++;
  return count;
}

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// ═══════════════════════════════════════
//  RESOURCE SYSTEM
// ═══════════════════════════════════════
function recalcResources() {
  let pG=0, pN=0, wG=0, wN=0, inc=0, up=0, hap=0, bld=0, rd=0;

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = grid[y][x];
      if (!c.type) continue;
      const b = BUILDINGS[c.type];
      if (!b) continue;
      if (c.type === 'road') { rd++; continue; }
      bld++;
      pG += b.pG; pN += b.pN;
      wG += b.wG; wN += b.wN;
      inc += b.income; up += b.upkeep;
      hap += b.happy;
    }
  }

  const hasPower = pG >= pN;
  const hasWater = wG >= wN;

  // Update tile warnings
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = grid[y][x];
      if (!c.type || c.type === 'road') continue;
      const b = BUILDINGS[c.type];
      c.el.classList.toggle('no-power', !hasPower && b.pN > 0);
      c.el.classList.toggle('no-water', !hasWater && b.wN > 0);
    }
  }

  // Satisfaction
  let sat = 50 + hap + CITY_POLICIES[cityPolicy].happy + municipalProjectHappiness();
  if (!hasPower) sat -= 15;
  if (!hasWater) sat -= 15;
  if (population > 0 && rd < population / 8) sat -= 5;
  // Pénalités externes (crime, pollution) injectées par systems.js
  if (typeof window._satPenaltyCrime     === 'number') sat -= window._satPenaltyCrime;
  if (typeof window._satPenaltyPollution === 'number') sat -= window._satPenaltyPollution;
  // Bonus externe (Smart City, etc.) injecté par progression.js
  if (typeof window._satBonus            === 'number') sat += window._satBonus;
  satisfaction = clamp(Math.round(sat), 0, 100);

  res = { pG, pN, wG, wN, income: inc, upkeep: up, buildings: bld, roads: rd };
}

// ═══════════════════════════════════════
//  UI UPDATE
// ═══════════════════════════════════════
function updateUI() {
  const $ = id => document.getElementById(id);

  $('s-budget').textContent = budget.toLocaleString('fr-FR');
  $('s-pop').textContent = population.toLocaleString('fr-FR');
  $('s-happy').textContent = satisfaction;
  $('s-power').textContent = `${res.pN}/${res.pG}`;
  $('s-water').textContent = `${res.wN}/${res.wG}`;

  $('ip-buildings').textContent = res.buildings;
  $('ip-roads').textContent = res.roads;
  $('ip-income').textContent = `+${res.income} $`;
  $('ip-expense').textContent = `-${res.upkeep} $`;

  // Bars
  const pPct = res.pG > 0 ? Math.min(100, (res.pN / res.pG) * 100) : 0;
  const wPct = res.wG > 0 ? Math.min(100, (res.wN / res.wG) * 100) : 0;
  $('bar-power').style.width = pPct + '%';
  $('bar-water').style.width = wPct + '%';
  $('bar-happy').style.width = satisfaction + '%';
  $('bar-power-txt').textContent = Math.round(pPct) + '%';
  $('bar-water-txt').textContent = Math.round(wPct) + '%';
  $('bar-happy-txt').textContent = satisfaction + '%';

  // Happy emoji
  const hi = $('happy-icon');
  if (satisfaction >= 70) hi.textContent = '😊';
  else if (satisfaction >= 40) hi.textContent = '😐';
  else hi.textContent = '😟';

  // HUD danger states
  document.querySelector('[data-type="power"]')?.classList.toggle('danger', res.pN > res.pG && res.pG > 0);
  document.querySelector('[data-type="water"]')?.classList.toggle('danger', res.wN > res.wG && res.wG > 0);
  document.querySelector('[data-type="happy"]')?.classList.toggle('danger', satisfaction < 30);

  // Day/night
  const hour = (tick % 240) / 10;
  let overlay = 'transparent';
  if (hour > 18 || hour < 6) overlay = 'rgba(0,8,30,.25)';
  if (hour > 20 || hour < 4) overlay = 'rgba(0,4,20,.4)';
  $('day-overlay').style.background = overlay;

  // Tool affordability
  updateToolAffordability();
}

// ═══════════════════════════════════════
//  TOOLTIP (desktop only)
// ═══════════════════════════════════════
function showTooltip(x, y) {
  // skip on touch devices
  if ('ontouchstart' in window && window.innerWidth < 700) return;

  const cell = grid[y][x];
  const tt = tooltipEl;

  if (cell.type && BUILDINGS[cell.type]) {
    const b = BUILDINGS[cell.type];
    tt.querySelector('.tt-title').textContent = b.label;
    let info = [];
    if (cell.pop > 0)  info.push(`👥 Habitants: ${cell.pop}`);
    if (b.income > 0)  info.push(`💰 Revenu: +${b.income}$/cycle`);
    if (b.upkeep > 0)  info.push(`🔧 Entretien: -${b.upkeep}$/cycle`);
    if (b.pG > 0)      info.push(`⚡ Produit: +${b.pG} énergie`);
    if (b.wG > 0)      info.push(`💧 Produit: +${b.wG} eau`);
    if (b.pN > 0)      info.push(`⚡ Besoin: ${b.pN} énergie`);
    if (b.wN > 0)      info.push(`💧 Besoin: ${b.wN} eau`);
    if (b.happy !== 0)  info.push(`${b.happy > 0 ? '😊' : '😟'} Satisfaction: ${b.happy > 0 ? '+' : ''}${b.happy}`);
    tt.querySelector('.tt-info').textContent = info.join('\n');
    tt.classList.add('visible');
  } else if (!cell.type && BUILDINGS[tool]) {
    const b = BUILDINGS[tool];
    tt.querySelector('.tt-title').textContent = `Placer: ${b.label}`;
    tt.querySelector('.tt-info').textContent = `Coût: ${b.cost} $`;
    tt.classList.add('visible');
  } else {
    tt.classList.remove('visible');
  }
}

function hideTooltip() {
  tooltipEl.classList.remove('visible');
}
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;

// ═══════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════
function notify(msg, type = 'error') {
  const el = document.createElement('div');
  el.className = 'notif' + (type === 'success' ? ' success' : type === 'info' ? ' info' : '');
  el.textContent = msg;
  notifBox.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ═══════════════════════════════════════
//  MINIMAP
// ═══════════════════════════════════════
function updateMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const px = canvas.width / GRID;

  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const colors = {
    road:'#3a3e45', house:'#3b9eff', shop:'#a855f7',
    office:'#38bdf8', power:'#fbbf24', water:'#22d3ee',
    park:'#22d67a', fire:'#ef4444', police:'#6366f1', school:'#d97706'
  };

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = grid[y][x];
      ctx.fillStyle = c.type ? (colors[c.type] || '#888') : '#162214';
      ctx.fillRect(x * px, y * px, px - .3, px - .3);
    }
  }
}

// ═══════════════════════════════════════
//  SPEED
// ═══════════════════════════════════════
function setSpeed(s) {
  speed = s;
  document.querySelectorAll('.spd-btn').forEach((b, i) => {
    b.classList.toggle('active', i === s);
  });
}

// ═══════════════════════════════════════
//  MOBILE PANEL TOGGLE
// ═══════════════════════════════════════
function toggleMobileStats() {
  document.getElementById('side-panel').classList.toggle('open');
}
// close panel when tapping outside on mobile
document.addEventListener('click', e => {
  const panel = document.getElementById('side-panel');
  const btn = document.getElementById('mobile-stats-btn');
  if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) {
    panel.classList.remove('open');
  }
});

// ═══════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════
// ── Safe gameTick dispatcher ──
// Modules can push to window._gameTickExtensions instead of patching gameTick
window._gameTickExtensions = window._gameTickExtensions || [];

window.gameTick = function gameTick() {
  if (!gameStarted || speed === 0) return;

  for (let i = 0; i < speed; i++) {
    tick++;

    if (tick % 60 === 0) {
      // Income & upkeep
      const net = res.income - res.upkeep;
      budget += net;

      // Taxes
      const taxRate = satisfaction > 70 ? 2 : satisfaction > 40 ? 1 : 0;
      budget += Math.round(population * taxRate * CITY_POLICIES[cityPolicy].tax);
      budget += municipalProjectIncome();

      // Growth
      if (satisfaction > 60 && population > 0) {
        population += randInt(0, 3);
      }

      // Decline
      if (satisfaction < 30 && population > 0) {
        population = Math.max(0, population - randInt(0, 3));
      }

      budget = Math.max(0, budget);
    }

    recalcResources();
  }

  updateUI();

  // Run extensions (journal, savegame, etc.)
  for (const ext of window._gameTickExtensions) {
    try { ext(); } catch(e) { console.error('[gameTick ext]', e); }
  }
};

setInterval(() => window.gameTick(), 200);

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
createMap();
recalcResources();
updateUI();
updateMinimap();

// ── Handle resize ──
window.addEventListener('resize', () => {
  if (gameStarted) centerCamera();
});

/* Municipal policy panel: one active choice, actual economy + satisfaction tradeoffs. */
function initMunicipalPolicies() {
  const sidePanel = document.getElementById('side-panel');
  if (!sidePanel || document.getElementById('city-policy-panel')) return;
  const panel = document.createElement('section');
  panel.id = 'city-policy-panel';
  panel.className = 'panel-section';
  panel.innerHTML = '<div class="panel-header">🏛️ Décisions du maire</div>' +
    '<p id="city-policy-status" style="font-size:11px;line-height:1.5;opacity:.86;margin:8px 0"></p>' +
    '<div id="city-policy-options" style="display:grid;gap:6px"></div>';
  sidePanel.appendChild(panel);
  const options = panel.querySelector('#city-policy-options');
  Object.keys(CITY_POLICIES).forEach(key => {
    const policy = CITY_POLICIES[key];
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = 'width:100%;text-align:left;padding:9px;border:1px solid #64748b;border-radius:7px;background:#18212c;color:#e5edf5;cursor:pointer;font-size:12px';
    button.textContent = policy.name + ' — ' + policy.desc;
    button.addEventListener('click', () => {
      cityPolicy = key;
      try { localStorage.setItem('warlike-city-policy', cityPolicy); } catch (_) {}
      recalcResources();
      updateUI();
      refreshPolicyButtons();
      if (typeof notify === 'function') notify('🏛️ Nouvelle politique : ' + policy.name, 'success');
    });
    button.dataset.policy = key;
    options.appendChild(button);
  });
  function refreshPolicyButtons() {
    options.querySelectorAll('button').forEach(button => {
      const active = button.dataset.policy === cityPolicy;
      button.setAttribute('aria-pressed', String(active));
      button.style.borderColor = active ? '#e6c16a' : '#64748b';
      button.style.background = active ? '#35412e' : '#18212c';
    });
  }
  refreshPolicyButtons();
  const status = document.getElementById('city-policy-status');
  if (status) status.textContent = CITY_POLICIES[cityPolicy].name + ' · Fiscalité x' + CITY_POLICIES[cityPolicy].tax;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMunicipalPolicies);
else initMunicipalPolicies();

/* Municipal investment projects: optional, permanent benefits with up-front costs.
   Different from milestone missions: the mayor chooses when to spend money. */
const MUNICIPAL_PROJECTS = [
  { id:'gardens', name:'🌳 Jardins communautaires', cost:650, happiness:8, income:0,
    description:'Espaces verts et qualité de vie : +8 satisfaction.' },
  { id:'logistics', name:'🚚 Plateforme logistique', cost:1600, happiness:-3, income:95,
    description:'Activité économique : +95 $ par cycle fiscal, -3 satisfaction.' },
  { id:'tramway', name:'🚋 Transport collectif', cost:2300, happiness:6, income:35,
    description:'Mobilité et attractivité : +6 satisfaction, +35 $ par cycle.' }
];
let municipalInvestments = [];
try {
  const saved = JSON.parse(localStorage.getItem('warlike-municipal-projects') || '[]');
  if (Array.isArray(saved)) municipalInvestments = saved.filter(id => MUNICIPAL_PROJECTS.some(p => p.id === id));
} catch (_) {}
function municipalProjectHappiness() {
  return MUNICIPAL_PROJECTS.reduce((sum,p) => sum + (municipalInvestments.includes(p.id) ? p.happiness : 0), 0);
}
function municipalProjectIncome() {
  return MUNICIPAL_PROJECTS.reduce((sum,p) => sum + (municipalInvestments.includes(p.id) ? p.income : 0), 0);
}
function initMunicipalProjects() {
  const parent = document.getElementById('side-panel');
  if (!parent || document.getElementById('municipal-investments')) return;
  const section = document.createElement('section');
  section.id = 'municipal-investments';
  section.className = 'panel-section';
  section.innerHTML = '<div class="panel-header">🏗️ Projets municipaux</div><div class="municipal-project-list" style="display:grid;gap:8px;padding:8px 0"></div>';
  parent.appendChild(section);
  const list = section.querySelector('.municipal-project-list');
  const buttons = [];
  MUNICIPAL_PROJECTS.forEach(project => {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = 'text-align:left;width:100%;padding:10px;border-radius:8px;border:1px solid #637084;color:#f0f4fa;background:#1b2834;cursor:pointer;white-space:normal;font-size:12px;line-height:1.5';
    button.addEventListener('click', () => {
      if (!gameStarted || municipalInvestments.includes(project.id) || budget < project.cost) return;
      budget -= project.cost;
      municipalInvestments.push(project.id);
      try { localStorage.setItem('warlike-municipal-projects', JSON.stringify(municipalInvestments)); } catch (_) {}
      recalcResources();
      updateUI();
      refresh();
      if (typeof notify === 'function') notify('🏗️ Projet inauguré : ' + project.name, 'success');
    });
    buttons.push({project,button});
    list.appendChild(button);
  });
  function refresh() {
    buttons.forEach(({project,button}) => {
      const done = municipalInvestments.includes(project.id);
      button.disabled = done || !gameStarted || budget < project.cost;
      button.style.opacity = done ? '.65' : button.disabled ? '.55' : '1';
      button.style.borderColor = done ? '#63b88c' : '#637084';
      button.textContent = project.name + ' — ' + (done ? '✓ Réalisé' : project.cost.toLocaleString('fr-FR') + ' $') + ' · ' + project.description;
    });
  }
  refresh();
  // Re-evaluate affordability only once per simulation tick, never per animation frame.
  window._gameTickExtensions = window._gameTickExtensions || [];
  window._gameTickExtensions.push(refresh);
  section.addEventListener('pointerenter', refresh);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMunicipalProjects);
else initMunicipalProjects();
