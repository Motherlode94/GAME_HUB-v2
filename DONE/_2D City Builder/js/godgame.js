// ==========================================================
//  CITY BUILDER - God Game Extension
//  Adds upgrades, deterioration, military buildings and invasions
// ==========================================================

const GodGameModule = (() => {
  const MAX_LEVEL = 3;
  const state = {
    threat: 0,
    warsWon: 0,
    lastInvasionTick: -9999,
    initialized: false,
    defense: 0,
    grace: 35,
    maxGrace: 100,
    shieldTicks: 0,
  };

  const POWERS = {
    heal: { cost: 25, label: 'Guerison' },
    miracle: { cost: 50, label: 'Miracle' },
    sanctuary: { cost: 35, label: 'Sanctuaire' },
  };

  const EXTRA_BUILDINGS = {
    cityhall:   { cost: 1500, emoji: '🏛️', label: 'Hotel de Ville', pN: 3, wN: 2, pop: 0,      income: 12, upkeep: 12, happy: 10, pG: 0, wG: 0 },
    hotel:      { cost: 700,  emoji: '🏨', label: 'Hotel',          pN: 2, wN: 1, pop: [2, 6], income: 20, upkeep: 6,  happy: 3,  pG: 0, wG: 0 },
    barracks:   { cost: 900,  emoji: '🪖', label: 'Caserne',        pN: 2, wN: 1, pop: 0,      income: 0,  upkeep: 9,  happy: 2,  pG: 0, wG: 0 },
    watchtower: { cost: 450,  emoji: '🗼', label: 'Tour de Garde',  pN: 1, wN: 0, pop: 0,      income: 0,  upkeep: 4,  happy: 1,  pG: 0, wG: 0 },
    armory:     { cost: 1200, emoji: '🛡️', label: 'Arsenal',        pN: 3, wN: 1, pop: 0,      income: 6,  upkeep: 11, happy: -1, pG: 0, wG: 0 },
    bunker:     { cost: 1800, emoji: '🏰', label: 'Bunker',         pN: 2, wN: 0, pop: 0,      income: 0,  upkeep: 14, happy: -2, pG: 0, wG: 0 },
  };

  const DEFENSE_VALUES = {
    cityhall: 18,
    barracks: 16,
    watchtower: 10,
    armory: 12,
    bunker: 20,
    police: 4,
    fire: 2,
  };

  const GOD_BUTTONS = [
    { type: 'divider' },
    { tool: 'upgrade', icon: '⬆️', label: 'Ameliorer', cost: 'L+$', key: 'U', cls: 'god-upgrade' },
    { tool: 'repair', icon: '🔧', label: 'Reparer', cost: 'Fix', key: 'R', cls: 'god-repair' },
    { type: 'divider' },
    { tool: 'cityhall', icon: '🏛️', label: 'Mairie', cost: '1500$' },
    { tool: 'hotel', icon: '🏨', label: 'Hotel', cost: '700$' },
    { tool: 'barracks', icon: '🪖', label: 'Caserne', cost: '900$' },
    { tool: 'watchtower', icon: '🗼', label: 'Tour', cost: '450$' },
    { tool: 'armory', icon: '🛡️', label: 'Arsenal', cost: '1200$' },
    { tool: 'bunker', icon: '🏰', label: 'Bunker', cost: '1800$' },
  ];

  const BUILDING_UNLOCK_RULES = {
    market: {
      check: () => hasTech('urbanisme'),
      reason: () => 'Debloquez la techno Urbanisme Avance.',
    },
    hospital: {
      check: () => hasTech('sante_publique'),
      reason: () => 'Debloquez la techno Sante Publique.',
    },
    stadium: {
      check: () => hasTech('urbanisme') && getHighestBuiltLevel() >= 2,
      reason: () => `Debloquez Urbanisme Avance et atteignez un batiment niveau 2 (actuel L${getHighestBuiltLevel()}).`,
    },
    factory: {
      check: () => hasTech('economie_avancee'),
      reason: () => 'Debloquez la techno Economie Avancee.',
    },
    airport: {
      check: () => hasTech('smart_city'),
      reason: () => 'Debloquez la techno Smart City.',
    },
    cityhall: {
      check: () => hasTech('urbanisme'),
      reason: () => 'Debloquez la techno Urbanisme Avance.',
    },
    hotel: {
      check: () => getHighestBuiltLevel() >= 2,
      reason: () => `Ameliorez un batiment au niveau 2 (actuel L${getHighestBuiltLevel()}).`,
    },
    barracks: {
      check: () => hasTech('securite'),
      reason: () => 'Debloquez la techno Securite Renforcee.',
    },
    watchtower: {
      check: () => hasTech('securite'),
      reason: () => 'Debloquez la techno Securite Renforcee.',
    },
    armory: {
      check: () => hasTech('securite') && getHighestBuiltLevel() >= 2,
      reason: () => `Debloquez Securite Renforcee et atteignez L2 (actuel L${getHighestBuiltLevel()}).`,
    },
    bunker: {
      check: () => hasTech('smart_city') && getHighestBuiltLevel() >= 3,
      reason: () => `Debloquez Smart City et atteignez L3 (actuel L${getHighestBuiltLevel()}).`,
    },
  };

  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function getTechUnlockedSet() {
    try {
      const state = window.ProgressionModule?.getTechState?.();
      if (state?.unlocked instanceof Set) return state.unlocked;
    } catch (e) {}
    return new Set();
  }

  function hasTech(id) {
    return getTechUnlockedSet().has(id);
  }

  function getRoadCount() {
    let count = 0;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (grid[y][x].type === 'road') count++;
      }
    }
    return count;
  }

  function getHighestBuiltLevel() {
    let highest = 1;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        if (!c.type || c.type === 'road') continue;
        const lvl = Number.isFinite(c.level) ? c.level : 1;
        if (lvl > highest) highest = lvl;
      }
    }
    return highest;
  }

  function getBuildingUnlockStatus(type) {
    const rule = BUILDING_UNLOCK_RULES[type];
    if (!rule) return { unlocked: true, reason: '' };

    let unlocked = false;
    try { unlocked = !!rule.check(); } catch (e) { unlocked = false; }
    return {
      unlocked,
      reason: unlocked ? '' : (typeof rule.reason === 'function' ? rule.reason() : String(rule.reason || 'Condition non satisfaite.')),
    };
  }

  function addBuildings() {
    Object.entries(EXTRA_BUILDINGS).forEach(([k, v]) => {
      if (!BUILDINGS[k]) BUILDINGS[k] = { ...v };
    });
  }

  function addToolbarButtons() {
    const bar = document.getElementById('toolbar-scroll');
    if (!bar) return;

    for (const item of GOD_BUTTONS) {
      if (item.type === 'divider') {
        const d = document.createElement('div');
        d.className = 'tool-divider';
        d.dataset.god = '1';
        bar.appendChild(d);
        continue;
      }

      if (bar.querySelector(`.tool-btn[data-tool="${item.tool}"]`)) continue;

      const btn = document.createElement('button');
      btn.className = `tool-btn ${item.cls || ''}`.trim();
      btn.dataset.tool = item.tool;
      btn.setAttribute('onclick', `selectTool('${item.tool}',this)`);

      const keyHtml = item.key ? `<span class="t-key">${item.key}</span>` : '';
      btn.innerHTML = `
        <span class="t-icon">${item.icon}</span>
        <span class="t-label">${item.label}</span>
        <span class="t-cost">${item.cost}</span>
        ${keyHtml}
      `;
      bar.appendChild(btn);
    }

    if (typeof updateToolAffordability === 'function') updateToolAffordability();
  }

  function patchToolLocking() {
    const prevSelectTool = window.selectTool;
    const prevUpdateToolAffordability = window.updateToolAffordability;

    if (typeof prevSelectTool === 'function') {
      const wrappedSelectTool = function(t, btn) {
        if (t && BUILDINGS[t] && t !== 'road') {
          if (getRoadCount() === 0) {
            notify('🛣️ Posez d abord une route pour debloquer la construction.', 'info');
            return;
          }
          const lock = getBuildingUnlockStatus(t);
          if (!lock.unlocked) {
            notify(`🔒 ${lock.reason}`, 'info');
            return;
          }
        }
        prevSelectTool(t, btn);
      };
      window.selectTool = wrappedSelectTool;
      selectTool = wrappedSelectTool;
    }

    if (typeof prevUpdateToolAffordability === 'function') {
      const wrappedAffordability = function() {
        prevUpdateToolAffordability();
        const hasRoad = getRoadCount() > 0;

        document.querySelectorAll('.tool-btn').forEach(btn => {
          const t = btn.dataset.tool;
          if (!t || t === 'demolish' || t === 'road' || t === 'upgrade' || t === 'repair') return;
          if (!BUILDINGS[t]) return;

          let lockReason = '';
          if (!hasRoad) {
            lockReason = 'Construisez d abord une route.';
          } else {
            const lock = getBuildingUnlockStatus(t);
            if (!lock.unlocked) lockReason = lock.reason;
          }

          const isLocked = lockReason.length > 0;
          btn.classList.toggle('locked', isLocked);
          if (isLocked) {
            btn.dataset.lockReason = lockReason;
            btn.title = '🔒 ' + lockReason;
          } else {
            delete btn.dataset.lockReason;
            if (btn.title && btn.title.startsWith('🔒')) btn.title = '';
          }
        });
      };

      window.updateToolAffordability = wrappedAffordability;
      updateToolAffordability = wrappedAffordability;
    }
  }

  function ensureTerrainVisual(cell) {
    if (!cell || !cell.el) return;

    const terrainType = (typeof terrainMap !== 'undefined' ? terrainMap[cell.y]?.[cell.x] : null) || cell.terrain;
    if (!terrainType || terrainType === 'grass') return;

    cell.el.classList.add('terrain-' + terrainType);
    if (typeof TERRAIN !== 'undefined' && TERRAIN[terrainType]?.icon && !cell.el.querySelector('.terrain-bg-icon')) {
      const bg = document.createElement('span');
      bg.className = 'terrain-bg-icon';
      bg.textContent = TERRAIN[terrainType].icon;
      cell.el.appendChild(bg);
    }
  }

  function normalizeCellMeta(cell) {
    if (!cell) return;
    if (!cell.type || cell.type === 'road') {
      cell.level = 1;
      cell.condition = 100;
      cell.basePop = cell.basePop || 0;
      return;
    }
    if (!Number.isFinite(cell.level)) cell.level = 1;
    if (!Number.isFinite(cell.condition)) cell.condition = 100;
    cell.level = clampNum(Math.round(cell.level), 1, MAX_LEVEL);
    cell.condition = clampNum(Number(cell.condition), 0, 100);
    if (!Number.isFinite(cell.basePop)) cell.basePop = cell.pop || 0;
  }

  function getCellLevel(cell) {
    normalizeCellMeta(cell);
    return cell.level || 1;
  }

  function getCellCondition(cell) {
    normalizeCellMeta(cell);
    return Number(cell.condition ?? 100);
  }

  function setBadge(cell, cls, value) {
    let el = cell.el.querySelector(`.${cls}`);
    if (!el) {
      el = document.createElement('span');
      el.className = cls;
      cell.el.appendChild(el);
    }
    el.textContent = value;
  }

  function clearBadges(cell) {
    if (!cell?.el) return;
    cell.el.querySelectorAll('.tile-level, .tile-condition').forEach(n => n.remove());
    cell.el.classList.remove('cond-low', 'cond-critical', 'god-upgraded');
  }

  function renderCellState(cell) {
    if (!cell || !cell.el) return;
    if (!cell.type || cell.type === 'road') {
      clearBadges(cell);
      return;
    }

    const lvl = getCellLevel(cell);
    const cond = Math.round(getCellCondition(cell));

    setBadge(cell, 'tile-level', 'L' + lvl);
    setBadge(cell, 'tile-condition', cond + '%');

    cell.el.classList.toggle('god-upgraded', lvl > 1);
    cell.el.classList.toggle('cond-low', cond <= 45 && cond > 20);
    cell.el.classList.toggle('cond-critical', cond <= 20);
  }

  function syncAllCellState() {
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        normalizeCellMeta(c);
        renderCellState(c);
      }
    }
  }

  function getUpgradeCost(cell) {
    const b = BUILDINGS[cell.type];
    if (!b) return 0;
    const lvl = getCellLevel(cell);
    const discount = clampNum(window._godUpgradeDiscount || 0, 0, 0.6);
    return Math.max(25, Math.round(b.cost * (0.6 + lvl * 0.45) * (1 - discount)));
  }

  function getRepairCost(cell) {
    const b = BUILDINGS[cell.type];
    if (!b) return 0;
    const damage = 100 - getCellCondition(cell);
    const discount = clampNum(window._godRepairDiscount || 0, 0, 0.7);
    return Math.max(25, Math.round(((b.cost * damage) / 220) * (1 - discount)));
  }

  function doUpgrade(cell) {
    if (!cell.type || cell.type === 'road') {
      notify('Selectionnez un batiment a ameliorer.', 'error');
      return;
    }

    const lvl = getCellLevel(cell);
    if (lvl >= MAX_LEVEL) {
      notify('Niveau maximal atteint.', 'info');
      return;
    }

    const cost = getUpgradeCost(cell);
    if (budget < cost) {
      notify(`Budget insuffisant (amelioration: ${cost}$).`, 'error');
      return;
    }

    budget -= cost;
    cell.level = clampNum(lvl + 1, 1, MAX_LEVEL);
    cell.condition = clampNum(getCellCondition(cell) + 22, 0, 100);

    if (cell.basePop > 0) {
      const gain = Math.max(1, Math.round(cell.basePop * 0.25));
      cell.pop += gain;
      population += gain;
    }

    renderCellState(cell);
    recalcResources();
    updateUI();
    updateMinimap();
    notify(`Batiment ameliore niveau ${cell.level} (-${cost}$).`, 'success');
  }

  function doRepair(cell) {
    if (!cell.type || cell.type === 'road') {
      notify('Selectionnez un batiment a reparer.', 'error');
      return;
    }

    const cond = getCellCondition(cell);
    if (cond >= 98) {
      notify('Batiment deja en excellent etat.', 'info');
      return;
    }

    const cost = getRepairCost(cell);
    if (budget < cost) {
      notify(`Budget insuffisant (reparation: ${cost}$).`, 'error');
      return;
    }

    budget -= cost;
    cell.condition = clampNum(cond + 38, 0, 100);
    renderCellState(cell);

    recalcResources();
    updateUI();
    updateMinimap();
    notify(`Reparation effectuee (-${cost}$).`, 'success');
  }

  function clearCell(cell) {
    if (!cell) return;
    if (cell.pop > 0) {
      population = Math.max(0, population - cell.pop);
      cell.pop = 0;
    }
    cell.type = null;
    cell.level = 1;
    cell.condition = 100;
    cell.basePop = 0;
    cell.el.className = 'tile';
    cell.el.innerHTML = '';
    ensureTerrainVisual(cell);
  }

  function collapseCell(cell, reason) {
    const label = BUILDINGS[cell.type]?.label || 'Batiment';
    clearCell(cell);
    notify(`${label} s'effondre (${reason}).`, 'error');
  }

  function patchBuildAt() {
    const prev = window.buildAt;
    if (typeof prev !== 'function') return;

    window.buildAt = function(x, y) {
      const cell = grid[y]?.[x];
      if (!cell) return;

      if (tool === 'upgrade') {
        doUpgrade(cell);
        return;
      }
      if (tool === 'repair') {
        doRepair(cell);
        return;
      }

      if (tool !== 'road' && tool !== 'demolish' && BUILDINGS[tool]) {
        if (getRoadCount() === 0) {
          notify('🛣️ Posez au moins une route avant de construire des batiments.', 'error');
          return;
        }

        const lock = getBuildingUnlockStatus(tool);
        if (!lock.unlocked) {
          notify(`🔒 ${lock.reason}`, 'error');
          return;
        }
      }

      const beforeType = cell.type;
      prev(x, y);

      if (!beforeType && cell.type && cell.type !== 'road') {
        cell.level = 1;
        cell.condition = 100;
        cell.basePop = cell.pop || 0;
        renderCellState(cell);
      } else if (beforeType && !cell.type) {
        clearBadges(cell);
        ensureTerrainVisual(cell);
      }
    };
  }

  function patchTooltip() {
    const prev = window.showTooltip;
    if (typeof prev !== 'function') return;

    window.showTooltip = function(x, y) {
      prev(x, y);

      const tt = document.getElementById('tooltip');
      if (!tt) return;
      const titleEl = tt.querySelector('.tt-title');
      const infoEl = tt.querySelector('.tt-info');
      if (!titleEl || !infoEl) return;

      const cell = grid[y]?.[x];
      if (!cell) return;

      if (cell.type && cell.type !== 'road') {
        const lvl = getCellLevel(cell);
        const cond = Math.round(getCellCondition(cell));
        const extra = [
          `Niveau: ${lvl}/${MAX_LEVEL}`,
          `Etat: ${cond}%`,
        ];
        if (tool === 'upgrade') extra.push(`Cout amelioration: ${getUpgradeCost(cell)}$`);
        if (tool === 'repair') extra.push(`Cout reparation: ${getRepairCost(cell)}$`);
        infoEl.textContent = (infoEl.textContent ? infoEl.textContent + '\n' : '') + extra.join('\n');
        tt.classList.add('visible');
        return;
      }

      if (!cell.type && (tool === 'upgrade' || tool === 'repair')) {
        titleEl.textContent = tool === 'upgrade' ? 'Ameliorer' : 'Reparer';
        infoEl.textContent = 'Touchez un batiment existant.';
        tt.classList.add('visible');
        return;
      }

      if (!cell.type && BUILDINGS[tool] && tool !== 'road') {
        if (getRoadCount() === 0) {
          titleEl.textContent = 'Construction verrouillee';
          infoEl.textContent = 'Construisez d abord une route.';
          tt.classList.add('visible');
          return;
        }
        const lock = getBuildingUnlockStatus(tool);
        if (!lock.unlocked) {
          titleEl.textContent = 'Construction verrouillee';
          infoEl.textContent = lock.reason;
          tt.classList.add('visible');
        }
      }
    };
  }

  function patchMinimap() {
    const prev = window.updateMinimap;
    if (typeof prev !== 'function') return;

    const colors = {
      cityhall: '#f472b6',
      hotel: '#f59e0b',
      barracks: '#ef4444',
      watchtower: '#60a5fa',
      armory: '#fb7185',
      bunker: '#8b5cf6',
    };

    window.updateMinimap = function() {
      prev();
      const canvas = document.getElementById('minimap-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const px = canvas.width / GRID;

      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const c = grid[y][x];
          const col = c.type ? colors[c.type] : null;
          if (!col) continue;
          ctx.fillStyle = col;
          ctx.fillRect(x * px, y * px, px - 0.3, px - 0.3);
        }
      }
    };
  }

  function patchResourceRecalc() {
    recalcResources = function() {
      let pG = 0;
      let pN = 0;
      let wG = 0;
      let wN = 0;
      let inc = 0;
      let up = 0;
      let hap = 0;
      let bld = 0;
      let rd = 0;
      let condSum = 0;
      let condCount = 0;
      let weakCount = 0;

      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const c = grid[y][x];
          if (!c.type) continue;
          const b = BUILDINGS[c.type];
          if (!b) continue;

          if (c.type === 'road') {
            rd++;
            continue;
          }

          bld++;

          const lvl = getCellLevel(c);
          const cond = getCellCondition(c);
          const upgradeOutBonus = clampNum(window._godUpgradeOutputBonus || 0, 0, 0.5);
          const condRatio = clampNum(cond / 100, 0.2, 1.1);
          const lvlOut = 1 + (lvl - 1) * (0.28 + upgradeOutBonus * 0.5);
          const needMul = (1 + (lvl - 1) * 0.2) * (0.78 + condRatio * 0.22);
          const outMul = lvlOut * condRatio;
          const upMul = 1 + (lvl - 1) * 0.24 + (1 - condRatio) * 0.45;

          pG += b.pG * outMul;
          wG += b.wG * outMul;
          pN += b.pN * needMul;
          wN += b.wN * needMul;
          inc += b.income * outMul;
          up += b.upkeep * upMul;
          hap += b.happy * (0.55 + condRatio * 0.45);

          condSum += cond;
          condCount++;
          if (cond < 45) weakCount++;
        }
      }

      pG = Math.round(pG);
      pN = Math.round(pN);
      wG = Math.round(wG);
      wN = Math.round(wN);
      inc = Math.round(inc);
      up = Math.round(up);

      const hasPower = pG >= pN;
      const hasWater = wG >= wN;

      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const c = grid[y][x];
          if (!c.type || c.type === 'road') continue;
          const b = BUILDINGS[c.type];
          c.el.classList.toggle('no-power', !hasPower && b.pN > 0);
          c.el.classList.toggle('no-water', !hasWater && b.wN > 0);
        }
      }

      let sat = 50 + hap;
      if (!hasPower) sat -= 15;
      if (!hasWater) sat -= 15;
      if (population > 0 && rd < population / 8) sat -= 5;

      if (typeof window._satPenaltyCrime === 'number') sat -= window._satPenaltyCrime;
      if (typeof window._satPenaltyPollution === 'number') sat -= window._satPenaltyPollution;
      if (typeof window._satBonus === 'number') sat += window._satBonus;

      const avgCond = condCount > 0 ? condSum / condCount : 100;
      if (avgCond < 75) sat -= Math.round((75 - avgCond) * 0.22);
      if (weakCount > 0) sat -= Math.min(12, Math.round(weakCount * 0.6));
      if (state.threat > 50) sat -= Math.round((state.threat - 50) * 0.2);

      satisfaction = clampNum(Math.round(sat), 0, 100);

      window._godAvgCondition = Math.round(avgCond);
      res = { pG, pN, wG, wN, income: inc, upkeep: up, buildings: bld, roads: rd };
    };
    window.recalcResources = recalcResources;
  }

  function getDefenseScore() {
    let score = 0;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        if (!c.type) continue;
        const base = DEFENSE_VALUES[c.type] || 0;
        if (!base) continue;
        const lvl = getCellLevel(c);
        const cond = getCellCondition(c);
        const lvlMul = 1 + (lvl - 1) * 0.35;
        const condMul = 0.5 + (cond / 100) * 0.5;
        score += base * lvlMul * condMul;
      }
    }
    score += Math.floor(population / 90);
    return Math.round(score);
  }

  function damageRandomBuildings(power) {
    const targets = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        if (c.type && c.type !== 'road') targets.push(c);
      }
    }
    if (targets.length === 0) return 0;

    let destroyed = 0;
    const hits = clampNum(Math.round(power / 18), 1, Math.min(7, targets.length));
    for (let i = 0; i < hits; i++) {
      const idx = rand(0, targets.length - 1);
      const cell = targets.splice(idx, 1)[0];
      if (!cell || !cell.type) continue;

      const hit = rand(22, 55) + power * 0.12;
      cell.condition = clampNum(getCellCondition(cell) - hit, 0, 100);
      if (cell.condition <= 0 || (cell.condition < 8 && Math.random() < 0.45)) {
        collapseCell(cell, 'attaque');
        destroyed++;
      } else {
        renderCellState(cell);
      }
    }
    return destroyed;
  }

  function launchInvasion() {
    state.lastInvasionTick = tick;
    const defense = getDefenseScore();
    const attack = 30 + state.threat * 0.9 + rand(0, 25) + res.buildings * 0.18;
    const shieldMul = state.shieldTicks > 0 ? 1.35 : 1;
    const defenseRoll = defense * (0.85 + Math.random() * 0.35) * shieldMul;

    if (defenseRoll >= attack) {
      const cost = Math.round(120 + attack * 1.8);
      budget = Math.max(0, budget - cost);
      satisfaction = clampNum(satisfaction + 4, 0, 100);
      state.warsWon += 1;
      state.threat = clampNum(state.threat - 22, 0, 100);
      notify(`Invasion repoussee ! Cout defense: ${cost}$.`, 'success');
      damageRandomBuildings(attack * 0.18);
    } else {
      const deficit = attack - defenseRoll;
      const sanctuaryReduction = state.shieldTicks > 0 ? 0.65 : 1;
      const budgetLoss = Math.round((260 + deficit * 13) * sanctuaryReduction);
      const popLoss = Math.min(population, Math.round((deficit * 0.35 + rand(2, 8)) * sanctuaryReduction));
      const satLoss = Math.min(30, Math.round((deficit * 0.3 + 8) * sanctuaryReduction));

      budget = Math.max(0, budget - budgetLoss);
      population = Math.max(0, population - popLoss);
      satisfaction = clampNum(satisfaction - satLoss, 0, 100);
      const destroyed = damageRandomBuildings(deficit * sanctuaryReduction);
      state.threat = clampNum(state.threat - 14, 0, 100);

      notify(`Invasion subie ! -${budgetLoss}$, -${popLoss} hab, ${destroyed} pertes.`, 'error');
    }

    recalcResources();
    updateUI();
    updateMinimap();
    updateWarUI();
  }

  function deteriorationTick() {
    const hasPower = res.pG >= res.pN;
    const hasWater = res.wG >= res.wN;
    const weather = typeof weatherState !== 'undefined' ? weatherState.current : null;
    const systems = (typeof SystemsModule !== 'undefined' && typeof SystemsModule.getState === 'function')
      ? SystemsModule.getState()
      : null;
    const pollution = systems?.pollution || 0;
    const crime = systems?.crime || 0;
    const cityhallCount = countBuildingType('cityhall');
    const maintenance = Math.min(0.35, cityhallCount * 0.06);
    const missionDecayBonus = clampNum(window._godDeteriorationBonus || 0, 0, 0.6);

    let changed = false;
    let collapses = 0;

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        if (!c.type || c.type === 'road') continue;

        const b = BUILDINGS[c.type];
        if (!b) continue;

        let decay = 0.16 + (b.upkeep || 0) * 0.018;
        if (!hasPower && b.pN > 0) decay += 0.45;
        if (!hasWater && b.wN > 0) decay += 0.45;
        if (weather === 'storm' || weather === 'snow') decay += 0.24;
        if (pollution > 65) decay += 0.2;
        if (crime > 65) decay += 0.2;
        if (budget < res.upkeep) decay += 0.25;
        if (DEFENSE_VALUES[c.type]) decay *= 0.85;
        if (state.shieldTicks > 0) decay *= 0.65;
        decay = Math.max(0.03, decay - maintenance - missionDecayBonus);

        c.condition = clampNum(getCellCondition(c) - decay, 0, 100);

        if (c.condition <= 2 && Math.random() < 0.12) {
          collapseCell(c, 'deterioration');
          collapses++;
        } else {
          renderCellState(c);
        }
        changed = true;
      }
    }

    if (collapses > 0) notify(`${collapses} batiment(s) perdu(s) par usure.`, 'error');
    if (changed) {
      recalcResources();
      updateUI();
      updateMinimap();
    }
  }

  function updateThreat() {
    const defense = getDefenseScore();
    state.defense = defense;
    const missionThreatBonus = window._godThreatMitigationBonus || 0;

    let rise = 1.8 + res.buildings * 0.035 + population * 0.004;
    rise -= defense * 0.055;
    rise -= missionThreatBonus;
    if (countBuildingType('cityhall') === 0 && res.buildings >= 6) rise += 2;

    state.threat = clampNum(state.threat + rise, 0, 100);
  }

  function maybeInvasion() {
    if (tick - state.lastInvasionTick < 240) return;
    if (res.buildings < 8) return;
    if (state.threat < 38) return;

    const chance = clampNum((state.threat - 30) / 220, 0.03, 0.5);
    if (Math.random() < chance) launchInvasion();
  }

  function gainGrace(amount) {
    state.grace = clampNum(state.grace + amount, 0, state.maxGrace);
  }

  function spendGrace(cost) {
    if (state.grace < cost) {
      notify(`✨ Grace insuffisante (${cost} requis).`, 'error');
      return false;
    }
    state.grace = clampNum(state.grace - cost, 0, state.maxGrace);
    return true;
  }

  function castHeal() {
    if (!spendGrace(POWERS.heal.cost)) return false;

    let fixed = 0;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x];
        if (!c.type || c.type === 'road') continue;
        const before = getCellCondition(c);
        c.condition = clampNum(before + rand(18, 35), 0, 100);
        if (c.condition > before) fixed++;
        renderCellState(c);
      }
    }

    satisfaction = clampNum(satisfaction + 5, 0, 100);
    recalcResources();
    updateUI();
    updateMinimap();
    updateWarUI();
    notify(`✨ Guerison lancee: ${fixed} batiment(s) restaures.`, 'success');
    return true;
  }

  function castMiracle() {
    if (!spendGrace(POWERS.miracle.cost)) return false;

    const bonus = Math.round(900 + population * 1.8 + res.buildings * 6);
    budget += bonus;
    satisfaction = clampNum(satisfaction + 10, 0, 100);
    state.threat = clampNum(state.threat - 10, 0, 100);

    if (population > 0) population += rand(2, 10);

    recalcResources();
    updateUI();
    updateWarUI();
    notify(`🌟 Miracle accorde: +${bonus}$ et elan populaire.`, 'success');
    return true;
  }

  function castSanctuary() {
    if (!spendGrace(POWERS.sanctuary.cost)) return false;
    state.shieldTicks = Math.max(state.shieldTicks, 240);
    state.threat = clampNum(state.threat - 18, 0, 100);
    updateWarUI();
    notify('🛐 Sanctuaire actif: ville protegee temporairement.', 'success');
    return true;
  }

  function castPower(powerId) {
    if (!gameStarted) return false;
    if (powerId === 'heal') return castHeal();
    if (powerId === 'miracle') return castMiracle();
    if (powerId === 'sanctuary') return castSanctuary();
    return false;
  }

  function buildWarUI() {
    const panel = document.getElementById('side-panel');
    if (!panel || document.getElementById('godgame-section')) return;

    const section = document.createElement('div');
    section.className = 'panel-section';
    section.id = 'godgame-section';
    section.innerHTML = `
      <div class="panel-header">Defense & Menace</div>
      <div class="bar-group">
        <div class="bar-row">
          <span class="bar-label">Menace</span>
          <span class="bar-val" id="god-threat-txt">0%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill god-threat" id="god-threat-bar" style="width:0%"></div>
        </div>
      </div>
      <div class="bar-group">
        <div class="bar-row">
          <span class="bar-label">Defense</span>
          <span class="bar-val" id="god-defense-txt">0</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill god-defense" id="god-defense-bar" style="width:0%"></div>
        </div>
      </div>
      <div class="bar-group">
        <div class="bar-row">
          <span class="bar-label">Etat moyen</span>
          <span class="bar-val" id="god-cond-txt">100%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill god-condition" id="god-cond-bar" style="width:100%"></div>
        </div>
      </div>
      <div class="bar-group">
        <div class="bar-row">
          <span class="bar-label">Grace Divine</span>
          <span class="bar-val" id="god-grace-txt">0/100</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill god-grace" id="god-grace-bar" style="width:0%"></div>
        </div>
      </div>
      <div class="god-stats">
        <span>Victoires: <b id="god-wars">0</b></span>
        <span>Radar: <b id="god-ready">Calme</b></span>
      </div>
      <div class="god-power-actions">
        <button class="god-power-btn" id="god-power-heal" onclick="GodGameModule.cast('heal')">Guerison (${POWERS.heal.cost})</button>
        <button class="god-power-btn" id="god-power-miracle" onclick="GodGameModule.cast('miracle')">Miracle (${POWERS.miracle.cost})</button>
        <button class="god-power-btn" id="god-power-sanctuary" onclick="GodGameModule.cast('sanctuary')">Sanctuaire (${POWERS.sanctuary.cost})</button>
      </div>
    `;
    panel.appendChild(section);

    const topStats = document.getElementById('topbar-stats');
    if (topStats && !document.getElementById('god-threat-badge')) {
      const b1 = document.createElement('div');
      b1.id = 'god-threat-badge';
      b1.className = 'god-badge';
      b1.innerHTML = `MENACE <span id="god-threat-mini">0%</span>`;

      const b2 = document.createElement('div');
      b2.id = 'god-defense-badge';
      b2.className = 'god-badge';
      b2.innerHTML = `DEF <span id="god-defense-mini">0</span>`;

      topStats.appendChild(b1);
      topStats.appendChild(b2);
    }
  }

  function updateWarUI() {
    const threat = Math.round(state.threat);
    const defense = Math.round(state.defense || getDefenseScore());
    const cond = clampNum(window._godAvgCondition || 100, 0, 100);
    const gracePct = state.maxGrace > 0 ? clampNum((state.grace / state.maxGrace) * 100, 0, 100) : 0;

    const threatBar = document.getElementById('god-threat-bar');
    const defBar = document.getElementById('god-defense-bar');
    const condBar = document.getElementById('god-cond-bar');
    const graceBar = document.getElementById('god-grace-bar');

    if (threatBar) threatBar.style.width = `${threat}%`;
    if (defBar) {
      const pct = clampNum((defense / Math.max(30, res.buildings * 2.2 + 10)) * 100, 0, 100);
      defBar.style.width = `${pct}%`;
    }
    if (condBar) condBar.style.width = `${cond}%`;
    if (graceBar) graceBar.style.width = `${gracePct}%`;

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setText('god-threat-txt', `${threat}%`);
    setText('god-defense-txt', `${defense}`);
    setText('god-cond-txt', `${Math.round(cond)}%`);
    setText('god-grace-txt', `${Math.round(state.grace)}/${state.maxGrace}`);
    setText('god-wars', `${state.warsWon}`);
    setText('god-threat-mini', `${threat}%`);
    setText('god-defense-mini', `${defense}`);

    const ready = state.shieldTicks > 0
      ? `Bouclier ${Math.ceil(state.shieldTicks / 10)}s`
      : (threat > 70 ? 'Critique' : threat > 45 ? 'Alerte' : 'Calme');
    setText('god-ready', ready);

    const healBtn = document.getElementById('god-power-heal');
    const miracleBtn = document.getElementById('god-power-miracle');
    const sanctuaryBtn = document.getElementById('god-power-sanctuary');
    if (healBtn) healBtn.disabled = state.grace < POWERS.heal.cost;
    if (miracleBtn) miracleBtn.disabled = state.grace < POWERS.miracle.cost;
    if (sanctuaryBtn) sanctuaryBtn.disabled = state.grace < POWERS.sanctuary.cost;

    const threatBadge = document.getElementById('god-threat-badge');
    if (threatBadge) {
      threatBadge.className = 'god-badge' + (threat > 70 ? ' danger' : threat > 45 ? ' warn' : '');
    }
  }

  function getSaveKey(slot) {
    return slot === undefined || slot === 0 ? 'cb_autosave' : `cb_save_${slot}`;
  }

  function patchSaveLoad() {
    if (typeof serializeGrid === 'function') {
      serializeGrid = function() {
        const data = [];
        for (let y = 0; y < GRID; y++) {
          for (let x = 0; x < GRID; x++) {
            const c = grid[y][x];
            if (!c.type) continue;
            data.push({
              x,
              y,
              type: c.type,
              pop: c.pop || 0,
              level: c.type === 'road' ? 1 : getCellLevel(c),
              condition: c.type === 'road' ? 100 : Math.round(getCellCondition(c)),
              basePop: c.basePop || 0,
            });
          }
        }
        return data;
      };
      window.serializeGrid = serializeGrid;
    }

    if (typeof deserializeGrid === 'function') {
      const prevDeserialize = deserializeGrid;
      deserializeGrid = function(data) {
        prevDeserialize(data || []);
        const map = new Map((data || []).map(item => [`${item.x},${item.y}`, item]));
        for (let y = 0; y < GRID; y++) {
          for (let x = 0; x < GRID; x++) {
            const c = grid[y][x];
            if (!c.type) {
              clearBadges(c);
              ensureTerrainVisual(c);
              continue;
            }
            const item = map.get(`${x},${y}`) || {};
            c.level = clampNum(Math.round(item.level || 1), 1, MAX_LEVEL);
            c.condition = clampNum(Number(item.condition ?? 100), 0, 100);
            c.basePop = Number.isFinite(item.basePop) ? item.basePop : (c.pop || 0);
            renderCellState(c);
          }
        }
      };
      window.deserializeGrid = deserializeGrid;
    }

    if (typeof saveGame === 'function') {
      const prevSaveGame = saveGame;
      saveGame = function(slot) {
        const ok = prevSaveGame(slot);
        if (!ok) return ok;
        try {
          const key = getSaveKey(slot);
          const raw = localStorage.getItem(key);
          if (!raw) return ok;
          const data = JSON.parse(raw);
          data.godgame = {
            threat: state.threat,
            warsWon: state.warsWon,
            lastInvasionTick: state.lastInvasionTick,
            grace: state.grace,
            maxGrace: state.maxGrace,
            shieldTicks: state.shieldTicks,
          };
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          console.warn('[godgame] save extension failed', e);
        }
        return ok;
      };
      window.saveGame = saveGame;
    }

    if (typeof loadGame === 'function') {
      const prevLoadGame = loadGame;
      loadGame = function(slot) {
        const ok = prevLoadGame(slot);
        if (!ok) return ok;

        try {
          const key = getSaveKey(slot);
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            const g = data.godgame || {};
            state.threat = clampNum(Number(g.threat ?? 0), 0, 100);
            state.warsWon = Math.max(0, Math.round(Number(g.warsWon ?? 0)));
            state.lastInvasionTick = Number.isFinite(g.lastInvasionTick) ? g.lastInvasionTick : -9999;
            state.maxGrace = Math.max(40, Math.round(Number(g.maxGrace ?? state.maxGrace)));
            state.grace = clampNum(Number(g.grace ?? state.grace), 0, state.maxGrace);
            state.shieldTicks = Math.max(0, Math.round(Number(g.shieldTicks ?? 0)));
          }
        } catch (e) {
          console.warn('[godgame] load extension failed', e);
        }

        syncAllCellState();
        updateWarUI();
        return ok;
      };
      window.loadGame = loadGame;
    }
  }

  function addKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      if (e.key === 'u' || e.key === 'U') selectTool('upgrade');
      if (e.key === 'r' || e.key === 'R') selectTool('repair');
    });
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .tool-btn.god-upgrade.active {
        border-color: rgba(250, 204, 21, 0.9);
        color: #facc15;
        box-shadow: 0 0 12px rgba(250, 204, 21, 0.22);
      }
      .tool-btn.god-repair.active {
        border-color: rgba(34, 211, 238, 0.9);
        color: #22d3ee;
        box-shadow: 0 0 12px rgba(34, 211, 238, 0.22);
      }
      .tool-btn.locked {
        border-color: rgba(239, 68, 68, 0.28) !important;
        background: rgba(239, 68, 68, 0.08) !important;
      }
      .tool-btn.locked .t-cost {
        color: #ef4444;
        opacity: 0.9;
      }

      .tile.cityhall   { background: linear-gradient(145deg, #5b2b62, #422047); }
      .tile.hotel      { background: linear-gradient(145deg, #6a4514, #4d310f); }
      .tile.barracks   { background: linear-gradient(145deg, #5c2c2c, #422020); }
      .tile.watchtower { background: linear-gradient(145deg, #1f4666, #15344d); }
      .tile.armory     { background: linear-gradient(145deg, #5a2438, #401a29); }
      .tile.bunker     { background: linear-gradient(145deg, #3d355f, #2d2745); }

      .tile-level, .tile-condition {
        position: absolute;
        z-index: 9;
        font-family: 'Exo 2', sans-serif;
        font-weight: 800;
        border-radius: 3px;
        padding: 0 3px;
        line-height: 1.2;
        pointer-events: none;
      }
      .tile-level {
        top: 1px;
        left: 1px;
        font-size: 8px;
        color: #facc15;
        background: rgba(15, 20, 35, 0.7);
        border: 1px solid rgba(250, 204, 21, 0.3);
      }
      .tile-condition {
        bottom: 1px;
        right: 1px;
        font-size: 7px;
        color: #6b7fa3;
        background: rgba(10, 14, 26, 0.72);
        border: 1px solid rgba(107, 127, 163, 0.3);
      }
      .tile.god-upgraded {
        box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.25);
      }
      .tile.cond-low .tile-condition {
        color: #f97316;
        border-color: rgba(249, 115, 22, 0.35);
      }
      .tile.cond-critical .tile-condition {
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.45);
        animation: godCondBlink 1.1s ease infinite;
      }
      @keyframes godCondBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }

      .bar-fill.god-threat { background: #f97316; box-shadow: 0 0 8px rgba(249, 115, 22, 0.2); }
      .bar-fill.god-defense { background: #3b9eff; box-shadow: 0 0 8px rgba(59, 158, 255, 0.2); }
      .bar-fill.god-condition { background: #22d67a; box-shadow: 0 0 8px rgba(34, 214, 122, 0.18); }
      .bar-fill.god-grace { background: #a855f7; box-shadow: 0 0 8px rgba(168, 85, 247, 0.24); }

      .god-stats {
        margin-top: 6px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 11px;
        color: #6b7fa3;
      }
      .god-stats b {
        color: #d8e3f0;
        font-family: 'Exo 2', sans-serif;
      }
      .god-power-actions {
        margin-top: 8px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 6px;
      }
      .god-power-btn {
        border: 1px solid rgba(168, 85, 247, 0.35);
        background: rgba(168, 85, 247, 0.12);
        color: #d8e3f0;
        border-radius: 8px;
        padding: 6px 8px;
        font-size: 11px;
        font-family: 'Exo 2', sans-serif;
        font-weight: 700;
        cursor: pointer;
        transition: all .15s ease;
      }
      .god-power-btn:hover:not(:disabled) {
        background: rgba(168, 85, 247, 0.2);
        border-color: rgba(168, 85, 247, 0.55);
      }
      .god-power-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .god-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-family: 'Exo 2', sans-serif;
        font-weight: 800;
        color: #6b7fa3;
        padding: 3px 7px;
        border-radius: 6px;
        border: 1px solid rgba(56, 92, 148, 0.2);
        background: rgba(255, 255, 255, 0.03);
      }
      .god-badge.warn {
        color: #f97316;
        border-color: rgba(249, 115, 22, 0.35);
      }
      .god-badge.danger {
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  function registerTickExtension() {
    window._gameTickExtensions = window._gameTickExtensions || [];
    window._gameTickExtensions.push(function godGameTick() {
      if (!gameStarted || speed === 0) return;

      if (tick % 10 === 0) {
        const cityhall = countBuildingType('cityhall');
        const hospitals = countBuildingType('hospital');
        const parks = countBuildingType('park');
        const faithGain = 0.4 + satisfaction * 0.01 + cityhall * 0.35 + hospitals * 0.15 + parks * 0.03;
        gainGrace(faithGain);
      }

      if (state.shieldTicks > 0 && tick % 10 === 0) {
        state.shieldTicks = Math.max(0, state.shieldTicks - 10);
      }

      if (tick % 30 === 0) {
        deteriorationTick();
        updateWarUI();
      }

      if (tick % 60 === 0) {
        updateThreat();
        maybeInvasion();
        updateWarUI();
      }

      if (tick % 180 === 0 && state.threat > 70) {
        notify('Alerte: menace elevee. Renforcez vos defenses militaires.', 'error');
      }
    });
  }

  function init() {
    if (state.initialized) return;

    addBuildings();
    patchToolLocking();
    addToolbarButtons();
    injectStyles();
    buildWarUI();
    patchBuildAt();
    patchTooltip();
    patchMinimap();
    patchResourceRecalc();
    patchSaveLoad();
    addKeyboardShortcuts();
    syncAllCellState();
    registerTickExtension();

    recalcResources();
    updateUI();
    updateMinimap();
    updateThreat();
    updateWarUI();

    state.initialized = true;
    notify('Mode God Game actif: ameliorations, usure et invasions.', 'info');
  }

  return { init, cast: castPower, getState: () => ({ ...state }) };
})();

const _waitGodGame = setInterval(() => {
  if (
    typeof BUILDINGS !== 'undefined' &&
    typeof grid !== 'undefined' &&
    Array.isArray(grid[0]) && grid[0][0] &&
    typeof selectTool === 'function' &&
    typeof notify === 'function' &&
    typeof window.buildAt === 'function'
  ) {
    clearInterval(_waitGodGame);
    GodGameModule.init();
  }
}, 120);
