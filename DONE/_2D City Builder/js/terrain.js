// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Terrain Procédural
//  Rivières, collines, forêts, zones inondables
//  Inclure AVANT script.js (doit patcher createMap)
// ═══════════════════════════════════════════════════════

// ── TERRAIN TYPES ──
const TERRAIN = {
  grass:    { label: 'Herbe',        color: '#162214', buildable: true,  cost: 0   },
  forest:   { label: 'Forêt',        color: '#0d3a12', buildable: false, cost: 0, icon: '🌲' },
  water:    { label: 'Eau',          color: '#0d2a4a', buildable: false, cost: 0, icon: '🌊' },
  hill:     { label: 'Colline',      color: '#2a2218', buildable: true,  cost: 50, icon: '⛰️' },
  sand:     { label: 'Sable',        color: '#2a2412', buildable: true,  cost: 20  },
  wetland:  { label: 'Zone humide',  color: '#112418', buildable: false, cost: 0, icon: '🌿' },
};

// ── TERRAIN MAP ──
const terrainMap = []; // terrainMap[y][x] = terrain type string

// ── SIMPLE NOISE (deterministic pseudo-random field) ──
function makeNoise(seed) {
  let s = seed;
  return function(x, y) {
    s = (s * 9301 + 49297) % 233280;
    const n = Math.sin(x * 127.1 + y * 311.7 + s * 0.001) * 43758.5453;
    return n - Math.floor(n);
  };
}

function smoothNoise(x, y, scale, noise) {
  let v = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < 4; i++) {
    v += noise(x * freq / scale, y * freq / scale) * amp;
    max += amp; amp *= 0.5; freq *= 2;
  }
  return v / max;
}

// ── GENERATE TERRAIN ──
function generateTerrain() {
  const seed = Math.floor(Math.random() * 99999);
  const heightNoise = makeNoise(seed);
  const moistNoise  = makeNoise(seed + 1111);
  const forestNoise = makeNoise(seed + 2222);

  // Init
  for (let y = 0; y < GRID; y++) {
    terrainMap[y] = [];
    for (let x = 0; x < GRID; x++) {
      terrainMap[y][x] = 'grass';
    }
  }

  // Height & biome
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const h = smoothNoise(x, y, 12, heightNoise);
      const m = smoothNoise(x, y, 8,  moistNoise);
      const f = smoothNoise(x, y, 6,  forestNoise);

      if (h > 0.72) {
        terrainMap[y][x] = 'hill';
      } else if (h < 0.25) {
        terrainMap[y][x] = m > 0.5 ? 'wetland' : 'sand';
      } else if (m > 0.65 && f > 0.55) {
        terrainMap[y][x] = 'forest';
      }
    }
  }

  // Rivers (1–2 rivers)
  const numRivers = 1 + Math.floor(Math.random() * 2);
  for (let r = 0; r < numRivers; r++) {
    generateRiver(seed + r * 500);
  }

  // Shore sand around water
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (terrainMap[y][x] === 'water') {
        [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy]) => {
          const nx = x+dx, ny = y+dy;
          if (nx>=0 && nx<GRID && ny>=0 && ny<GRID && terrainMap[ny][nx] === 'grass') {
            terrainMap[ny][nx] = 'sand';
          }
        });
      }
    }
  }
}

function generateRiver(seed) {
  // Start from a random edge, flow toward opposite
  const side = Math.floor(Math.random() * 4);
  let x, y, dx, dy;

  if (side === 0) { x = Math.floor(Math.random() * GRID); y = 0; dx = 0; dy = 1; }
  else if (side === 1) { x = Math.floor(Math.random() * GRID); y = GRID-1; dx = 0; dy = -1; }
  else if (side === 2) { x = 0; y = Math.floor(Math.random() * GRID); dx = 1; dy = 0; }
  else { x = GRID-1; y = Math.floor(Math.random() * GRID); dx = -1; dy = 0; }

  const rng = makeNoise(seed);
  let step = 0;

  while (x >= 0 && x < GRID && y >= 0 && y < GRID && step < GRID * 3) {
    // Carve river (width 1-2)
    terrainMap[y][x] = 'water';
    const rndTurn = rng(x, y);
    if (rndTurn < 0.25) {
      // turn
      if (dx !== 0) { dy = rndTurn < 0.12 ? -1 : 1; dx = 0; }
      else { dx = rndTurn < 0.12 ? -1 : 1; dy = 0; }
    }
    // sometimes widen
    if (rng(x+0.5, y+0.5) > 0.65) {
      const wx = x + (dy !== 0 ? 1 : 0);
      const wy = y + (dx !== 0 ? 1 : 0);
      if (wx >= 0 && wx < GRID && wy >= 0 && wy < GRID) terrainMap[wy][wx] = 'water';
    }
    x += dx; y += dy; step++;
  }
}

// ── APPLY TERRAIN TO TILES (called after createMap) ──
function applyTerrainToTiles() {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const cell = grid[y][x];
      const t = terrainMap[y][x];
      const info = TERRAIN[t];
      if (!info) continue;

      cell.terrain = t;
      cell.el.classList.add('terrain-' + t);

      if (info.icon && t !== 'grass') {
        const bg = document.createElement('span');
        bg.className = 'terrain-bg-icon';
        bg.textContent = info.icon;
        cell.el.appendChild(bg);
      }
    }
  }
}

// ── PATCH buildAt to respect terrain ──
// This patches AFTER the original is defined
function patchBuildAtForTerrain() {
  const _prev = window.buildAt;
  if (typeof _prev !== 'function') {
    console.warn('[terrain] buildAt not found on window, terrain patch skipped');
    return;
  }
  window.buildAt = function(x, y) {
    if (!terrainMap[y] || !terrainMap[y][x]) return _prev(x, y);
    const t = terrainMap[y][x];
    const info = TERRAIN[t];
    if (!info) return _prev(x, y);

    if (!info.buildable) {
      const icons = { water:'🌊', forest:'🌲', wetland:'🌿' };
      notify(`${icons[t] || '🚫'} Terrain non constructible ici !`, 'error');
      return;
    }

    // Extra cost for hills/sand
    if (info.cost > 0 && tool !== 'demolish') {
      const extra = info.cost;
      if (budget < (BUILDINGS[tool]?.cost || 0) + extra) {
        notify(`⛰️ Coût de terrain supplémentaire : +${extra}$`, 'error');
        return;
      }
      budget -= extra;
    }

    _prev(x, y);
  };
}

// ── TERRAIN TOOLTIP enrichment ──
function enrichTerrainTooltip() {
  const _prev = window.showTooltip;
  if (!_prev) return;
  window.showTooltip = function(x, y) {
    _prev(x, y);
    const t = terrainMap[y]?.[x];
    if (!t || t === 'grass') return;
    const info = TERRAIN[t];
    if (!info) return;
    const tt = document.getElementById('tooltip');
    if (!tt) return;
    const infoEl = tt.querySelector('.tt-info');
    if (!infoEl) return;
    const extra = info.cost > 0 ? `\n⛰️ Surcoût terrain : +${info.cost}$` : (!info.buildable ? '\n🚫 Non constructible' : '');
    infoEl.textContent = (infoEl.textContent || '') + extra;
  };
}

// ── UPDATE MINIMAP with terrain ──
function enrichMinimap() {
  const _prev = window.updateMinimap;
  window.updateMinimap = function() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const px = canvas.width / GRID;

    // Terrain base
    const terrainColors = {
      grass: '#162214', forest: '#0d3a12', water: '#0d2a4a',
      hill: '#2a2218', sand: '#2a2412', wetland: '#112418',
    };

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const t = terrainMap[y]?.[x] || 'grass';
        ctx.fillStyle = terrainColors[t] || '#162214';
        ctx.fillRect(x * px, y * px, px - .3, px - .3);
      }
    }

    // Buildings on top
    const colors = {
      road:'#3a3e45', house:'#3b9eff', shop:'#a855f7',
      office:'#38bdf8', power:'#fbbf24', water:'#22d3ee',
      park:'#22d67a', fire:'#ef4444', police:'#6366f1', school:'#d97706',
      hospital:'#ec4899', stadium:'#8b5cf6', market:'#f97316',
      factory:'#6b7280', solar:'#facc15', windmill:'#67e8f9',
      library:'#a78bfa', airport:'#60a5fa',
    };

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        if (c.type) {
          ctx.fillStyle = colors[c.type] || '#888';
          ctx.fillRect(x * px, y * px, px - .3, px - .3);
        }
      }
    }
  };
}

// ── INJECT TERRAIN STYLES ──
function injectTerrainStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .terrain-bg-icon {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; opacity: 0.45;
      pointer-events: none; z-index: 0;
      filter: saturate(0.6);
    }

    .tile.terrain-water {
      background: linear-gradient(145deg, #0d3a5a, #082040) !important;
      cursor: not-allowed !important;
      animation: waterShimmer 3s ease infinite;
    }
    @keyframes waterShimmer {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .tile.terrain-forest {
      background: linear-gradient(145deg, #0d3a12, #082008) !important;
      cursor: not-allowed !important;
    }
    .tile.terrain-hill {
      background: linear-gradient(145deg, #3a2e1e, #2a2012) !important;
    }
    .tile.terrain-sand {
      background: linear-gradient(145deg, #3a3218, #2a2410) !important;
    }
    .tile.terrain-wetland {
      background: linear-gradient(145deg, #152e18, #0d2010) !important;
      cursor: not-allowed !important;
    }

    /* Non-buildable hover */
    .tile.terrain-water:hover,
    .tile.terrain-forest:hover,
    .tile.terrain-wetland:hover {
      box-shadow: 0 0 0 2px rgba(255,85,85,0.4) !important;
    }
    .tile.terrain-water:hover::after,
    .tile.terrain-forest:hover::after,
    .tile.terrain-wetland:hover::after {
      background: rgba(255,85,85,0.08) !important;
    }

    /* Hill extra cost indicator */
    .tile.terrain-hill:not([class*=' house']):not([class*=' road'])::before {
      content: '';
    }
  `;
  document.head.appendChild(style);
}

// ── INIT ──
function initTerrain() {
  injectTerrainStyles();
  generateTerrain();

  // Wait for map to be created, then apply
  const _waitMap = setInterval(() => {
    if (typeof grid !== 'undefined' && grid[0] && grid[0][0]) {
      clearInterval(_waitMap);
      applyTerrainToTiles();
      enrichMinimap();
      updateMinimap();
      patchBuildAtForTerrain();
      enrichTerrainTooltip();
    }
  }, 50);
}

// Start immediately (terrain generation happens before map render)
const _waitTerrain = setInterval(() => {
  if (typeof GRID !== 'undefined' && typeof grid !== 'undefined') {
    clearInterval(_waitTerrain);
    initTerrain();
  }
}, 50);