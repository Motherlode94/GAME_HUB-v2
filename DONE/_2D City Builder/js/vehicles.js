// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Véhicules & Piétons Animés
//  Apparaissent selon les bâtiments construits
//  Inclure après script.js
// ═══════════════════════════════════════════════════════

const VehicleSystem = (() => {

  // ── TYPES DE VÉHICULES par bâtiment déclencheur ──
  const VEHICLE_TYPES = {
    // Routes seules → voitures basiques
    road:     { emoji: ['🚗','🚙','🚕'], speed: 1.8, type: 'car' },
    // Maisons → voitures + piétons
    house:    { emoji: ['🚶','🚶‍♀️','🧍','🚴'], speed: 0.9, type: 'pedestrian' },
    // Commerce → camions livraison + clients
    shop:     { emoji: ['🚚','🛵','🚐'], speed: 1.4, type: 'delivery' },
    market:   { emoji: ['🚛','🚐','🛵'], speed: 1.2, type: 'delivery' },
    // Bureau → voitures de bureau
    office:   { emoji: ['🚗','🚙','🏎️'], speed: 2.2, type: 'car' },
    // Hôpital → ambulances
    hospital: { emoji: ['🚑'], speed: 2.6, type: 'emergency' },
    // Police → voitures police
    police:   { emoji: ['🚔'], speed: 2.4, type: 'emergency' },
    // Pompiers → camions
    fire:     { emoji: ['🚒'], speed: 2.5, type: 'emergency' },
    // École → bus scolaire
    school:   { emoji: ['🚌'], speed: 1.3, type: 'bus' },
    // Usine → camions lourds
    factory:  { emoji: ['🚛','🚜'], speed: 1.0, type: 'heavy' },
    // Aéroport → navettes
    airport:  { emoji: ['🚌','🚐','🚖'], speed: 1.6, type: 'bus' },
    // Stade → bus de supporters
    stadium:  { emoji: ['🚌','🚗','🏎️'], speed: 1.8, type: 'bus' },
  };

  // ── ÉTAT ──
  let vehicles = [];      // véhicules actifs sur la carte
  let animFrame = null;
  let canvas, ctx;
  let lastTime = 0;
  const MAX_VEHICLES = 24;

  // ── INIT ──
  function init() {
    injectStyles();
    createCanvas();
    spawnLoop();
    requestAnimationFrame(drawLoop);
  }

  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'vehicle-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: var(--topbar-h, 52px);
      left: 0; right: 0; bottom: 0;
      width: 100%; height: calc(100% - var(--topbar-h, 52px));
      pointer-events: none;
      z-index: 5;
    `;
    document.body.appendChild(canvas);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h') || '52');
    ctx = canvas.getContext('2d');
  }

  // ── TROUVER LES ROUTES SUR L'ÉCRAN ──
  function getRoadsOnScreen() {
    const roads = [];
    if (typeof grid === 'undefined') return roads;

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (grid[y][x].type !== 'road') continue;
        const screenPos = tileToScreen(x, y);
        if (!screenPos) continue;
        if (screenPos.sx > -60 && screenPos.sx < canvas.width + 60 &&
            screenPos.sy > -60 && screenPos.sy < canvas.height + 60) {
          roads.push({ x, y, sx: screenPos.sx, sy: screenPos.sy });
        }
      }
    }
    return roads;
  }

  // ── CONVERTIR COORDONNÉES TUILE → ÉCRAN ──
  function tileToScreen(tx, ty) {
    if (typeof camX === 'undefined' || typeof zoom === 'undefined') return null;
    const tileSize  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile') || '44');
    const padding   = 80;
    const gap       = 1;

    // Position dans le map-container (avec padding)
    const mx = padding + tx * (tileSize + gap);
    const my = padding + ty * (tileSize + gap);

    // Applique zoom + caméra
    const sx = mx * zoom + camX;
    const sy = my * zoom + camY;

    return { sx, sy, size: tileSize * zoom };
  }

  // ── QUEL TYPE DE VÉHICULE PEUT APPARAÎTRE ──
  function getAvailableVehicleTypes() {
    if (typeof countBuildingType === 'undefined') return ['road'];
    const available = [];

    // Toujours voitures si on a des routes
    if (typeof countBuildingType !== 'undefined') {
      const roadCount = countBuildingType('road');
      if (roadCount > 0) available.push('road');

      Object.keys(VEHICLE_TYPES).forEach(building => {
        if (building !== 'road' && countBuildingType(building) > 0) {
          available.push(building);
        }
      });
    }
    return available.length > 0 ? available : ['road'];
  }

  // ── CHERCHER UN CHEMIN DE ROUTE VALIDE ──
  function findRoadPath(startRoad, roads) {
    if (roads.length < 2) return null;

    // Construire un graphe de routes adjacentes
    const roadMap = {};
    roads.forEach(r => { roadMap[`${r.x},${r.y}`] = r; });

    // BFS court depuis startRoad
    const path = [startRoad];
    let current = startRoad;
    const visited = new Set([`${startRoad.x},${startRoad.y}`]);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const maxLen = 8 + Math.floor(Math.random() * 8);

    for (let step = 0; step < maxLen; step++) {
      const neighbors = [];
      dirs.forEach(([dx, dy]) => {
        const key = `${current.x+dx},${current.y+dy}`;
        if (roadMap[key] && !visited.has(key)) neighbors.push(roadMap[key]);
      });
      if (neighbors.length === 0) break;
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      visited.add(`${next.x},${next.y}`);
      path.push(next);
      current = next;
    }

    return path.length >= 2 ? path : null;
  }

  // ── SPAWNER UN VÉHICULE ──
  function spawnVehicle() {
    if (!gameStarted || speed === 0) return;
    if (vehicles.length >= MAX_VEHICLES) return;

    const roads = getRoadsOnScreen();
    if (roads.length < 2) return;

    const path = findRoadPath(roads[Math.floor(Math.random() * roads.length)], roads);
    if (!path || path.length < 2) return;

    const availableTypes = getAvailableVehicleTypes();
    const buildingType   = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const vType          = VEHICLE_TYPES[buildingType];
    const emoji          = vType.emoji[Math.floor(Math.random() * vType.emoji.length)];

    // Déterminer direction pour flip horizontal
    const dx = path[1].sx - path[0].sx;

    vehicles.push({
      emoji,
      path,
      pathIdx: 0,
      px: path[0].sx + path[0].size / 2,
      py: path[0].sy + path[0].size / 2,
      speed: vType.speed * (0.8 + Math.random() * 0.4),
      type: vType.type,
      alpha: 0,
      size: Math.max(12, Math.min(22, path[0].size * 0.45)),
      flipped: dx < 0,
      done: false,
    });
  }

  // ── LOOP DE SPAWN ──
  function spawnLoop() {
    setInterval(() => {
      if (!gameStarted || speed === 0) return;
      // Fréquence selon la taille de la ville
      const roadCount = typeof countBuildingType !== 'undefined' ? countBuildingType('road') : 0;
      const baseProb  = Math.min(0.9, 0.2 + roadCount * 0.03);
      if (Math.random() < baseProb && vehicles.length < MAX_VEHICLES) {
        spawnVehicle();
      }
    }, 800);
  }

  // ── BOUCLE DE DESSIN ──
  function drawLoop(timestamp) {
    animFrame = requestAnimationFrame(drawLoop);
    if (!ctx || !canvas) return;

    const dt = Math.min(50, timestamp - (lastTime || timestamp));
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted || speed === 0) return;

    const gameSpeed = speed || 1;

    vehicles = vehicles.filter(v => {
      if (v.done) return false;

      // Avancer sur le chemin
      const target = v.path[v.pathIdx + 1];
      if (!target) { v.done = true; return false; }

      // Recalc position écran (la caméra bouge)
      const tileNow   = v.path[v.pathIdx];
      const screenNow = tileToScreen(tileNow.x, tileNow.y);
      const screenTgt = tileToScreen(target.x, target.y);
      if (!screenNow || !screenTgt) { v.done = true; return false; }

      const txCenter = screenTgt.sx + screenTgt.size / 2;
      const tyCenter = screenTgt.sy + screenTgt.size / 2;
      const vxCenter = screenNow.sx + screenNow.size / 2;
      const vyCenter = screenNow.sy + screenNow.size / 2;

      // Interpoler vers la cible
      const ddx = txCenter - v.px;
      const ddy = tyCenter - v.py;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      const step = v.speed * gameSpeed * dt * 0.06;

      if (dist < step + 2) {
        v.px = txCenter;
        v.py = tyCenter;
        v.pathIdx++;
        if (v.pathIdx >= v.path.length - 1) { v.done = true; return false; }
        // Update flip direction
        const nextTarget = v.path[v.pathIdx + 1];
        if (nextTarget) {
          const ns = tileToScreen(nextTarget.x, nextTarget.y);
          if (ns) v.flipped = ns.sx < screenNow.sx;
        }
      } else {
        v.px += (ddx / dist) * step;
        v.py += (ddy / dist) * step;
        v.flipped = ddx < 0;
      }

      // Fade in/out
      if (v.pathIdx === 0) v.alpha = Math.min(1, v.alpha + 0.08);
      if (v.pathIdx >= v.path.length - 2) v.alpha = Math.max(0, v.alpha - 0.05);
      else v.alpha = Math.min(1, v.alpha + 0.05);

      // Cull si hors écran
      if (v.px < -80 || v.px > canvas.width + 80 ||
          v.py < -80 || v.py > canvas.height + 80) { v.done = true; return false; }

      // Dessiner
      ctx.save();
      ctx.globalAlpha = v.alpha;
      ctx.translate(v.px, v.py);
      if (v.flipped) ctx.scale(-1, 1);
      ctx.font = `${v.size}px serif`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';

      // Légère ombre pour lisibilité
      ctx.shadowColor   = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur    = 3;
      ctx.shadowOffsetY = 1;
      ctx.fillText(v.emoji, 0, 0);
      ctx.restore();

      return true;
    });
  }

  // ── STYLES ──
  function injectStyles() {
    // Pas de styles CSS nécessaires — canvas uniquement
  }

  // ── API publique ──
  return { init };

})();

// ── INIT ──
const _waitVehicles = setInterval(() => {
  if (typeof gameStarted !== 'undefined' && typeof grid !== 'undefined' &&
      typeof camX !== 'undefined' && typeof zoom !== 'undefined') {
    clearInterval(_waitVehicles);
    VehicleSystem.init();
  }
}, 200);