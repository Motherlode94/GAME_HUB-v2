// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Sauvegarde & Chargement
//  3 slots de sauvegarde · localStorage · Auto-save
//  Inclure après script.js
// ═══════════════════════════════════════════════════════

const SAVE_VERSION = '1.0';
const MAX_SLOTS = 3;
const AUTO_SAVE_INTERVAL = 120; // every 120 ticks (~24s at speed 1)

// ── SERIALIZE GRID ──
function serializeGrid() {
  const data = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = grid[y][x];
      if (c.type) data.push({ x, y, type: c.type, pop: c.pop || 0 });
    }
  }
  return data;
}

function deserializeGrid(data) {
  // Clear grid
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const cell = grid[y][x];
      cell.type = null; cell.pop = 0;
      cell.el.className = 'tile';
      // Re-apply terrain class if terrain module loaded
      if (typeof terrainMap !== 'undefined' && terrainMap[y]?.[x]) {
        cell.el.classList.add('terrain-' + terrainMap[y][x]);
      }
      cell.el.innerHTML = '';
      // Re-add terrain bg icon
      if (typeof terrainMap !== 'undefined' && typeof TERRAIN !== 'undefined') {
        const t = terrainMap[y]?.[x];
        if (t && TERRAIN[t]?.icon && t !== 'grass') {
          const bg = document.createElement('span');
          bg.className = 'terrain-bg-icon';
          bg.textContent = TERRAIN[t].icon;
          cell.el.appendChild(bg);
        }
      }
    }
  }

  // Rebuild from saved data
  for (const item of data) {
    const { x, y, type, pop } = item;
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) continue;
    const cell = grid[y][x];
    const info = BUILDINGS[type];
    if (!info) continue;

    cell.type = type;
    cell.pop = pop || 0;
    cell.el.classList.add(type);

    if (info.emoji) {
      cell.el.innerHTML += `<span class="emoji">${info.emoji}</span>`;
    } else if (type === 'road') {
      cell.el.innerHTML += '<span class="emoji">─</span>';
    }
  }
}

// ── SAVE ──
function saveGame(slot) {
  if (slot === undefined) slot = 0; // auto-save
  const saveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    slot,
    budget,
    population,
    satisfaction,
    tick,
    speed,
    tool,
    grid: serializeGrid(),
    // Weather & season state
    weather: typeof weatherState !== 'undefined' ? {
      current: weatherState.current,
      season: weatherState.season,
      seasonTick: weatherState.seasonTick,
      techBoost: weatherState.techBoost || 0,
    } : null,
    // Missions state
    missions: typeof missionState !== 'undefined' ? [...missionState.completed] : [],
  };

  try {
    const key = slot === 0 ? 'cb_autosave' : `cb_save_${slot}`;
    localStorage.setItem(key, JSON.stringify(saveData));
    if (slot > 0) {
      notify(`💾 Sauvegarde ${slot} réussie !`, 'success');
      addJournalEntry?.('💾', `Sauvegarde slot ${slot}`, 'success');
    }
    updateSaveUI();
    return true;
  } catch (e) {
    notify('❌ Échec de la sauvegarde (stockage plein ?)', 'error');
    return false;
  }
}

// ── LOAD ──
function loadGame(slot) {
  const key = slot === 0 ? 'cb_autosave' : `cb_save_${slot}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    notify(`📂 Aucune sauvegarde dans le slot ${slot}`, 'error');
    return false;
  }

  try {
    const data = JSON.parse(raw);

    // Restore global state
    budget = data.budget;
    population = data.population;
    satisfaction = data.satisfaction;
    tick = data.tick || 0;
    speed = data.speed || 1;

    // Restore grid
    deserializeGrid(data.grid || []);

    // Restore weather
    if (data.weather && typeof weatherState !== 'undefined') {
      weatherState.current = data.weather.current || 'clear';
      weatherState.season = data.weather.season || 'spring';
      weatherState.seasonTick = data.weather.seasonTick || 0;
      weatherState.techBoost = data.weather.techBoost || 0;
      if (typeof updateWeatherUI === 'function') updateWeatherUI();
      if (typeof updateSeasonUI === 'function') updateSeasonUI();
    }

    // Restore missions
    if (data.missions && typeof missionState !== 'undefined') {
      missionState.completed = new Set(data.missions);
    }

    recalcResources();
    updateUI();
    updateMinimap();
    selectTool(data.tool || 'road');
    setSpeed(data.speed || 1);

    notify(`📂 Sauvegarde ${slot > 0 ? slot : 'auto'} chargée !`, 'success');
    addJournalEntry?.('📂', `Partie chargée (slot ${slot > 0 ? slot : 'auto'})`, 'success');
    closeSavePanel();
    return true;
  } catch (e) {
    console.error('Load error:', e);
    notify('❌ Sauvegarde corrompue', 'error');
    return false;
  }
}

// ── DELETE SAVE ──
function deleteSave(slot) {
  const key = slot === 0 ? 'cb_autosave' : `cb_save_${slot}`;
  localStorage.removeItem(key);
  notify(`🗑️ Slot ${slot} effacé`, 'info');
  updateSaveUI();
}

// ── GET SAVE INFO ──
function getSaveInfo(slot) {
  const key = slot === 0 ? 'cb_autosave' : `cb_save_${slot}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    return {
      timestamp: d.timestamp,
      budget: d.budget,
      population: d.population,
      satisfaction: d.satisfaction,
      buildingCount: (d.grid || []).length,
      slot,
    };
  } catch { return null; }
}

// ── BUILD SAVE UI ──
function buildSavePanel() {
  const panel = document.createElement('div');
  panel.id = 'save-panel';
  panel.className = 'save-panel';
  panel.innerHTML = `
    <div class="sp-header">
      <div class="sp-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Sauvegardes
      </div>
      <button class="sp-close" onclick="closeSavePanel()">✕</button>
    </div>
    <div class="sp-slots" id="sp-slots"></div>
    <div class="sp-autosave" id="sp-autosave"></div>
  `;
  document.body.appendChild(panel);
  updateSaveUI();
}

function updateSaveUI() {
  const slotsEl = document.getElementById('sp-slots');
  const autoEl = document.getElementById('sp-autosave');
  if (!slotsEl) return;

  // Manual slots 1-3
  slotsEl.innerHTML = [1, 2, 3].map(slot => {
    const info = getSaveInfo(slot);
    const date = info ? new Date(info.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;

    return `
      <div class="sp-slot">
        <div class="sp-slot-header">
          <span class="sp-slot-num">Slot ${slot}</span>
          ${info ? `<span class="sp-slot-date">${date}</span>` : '<span class="sp-slot-empty">Vide</span>'}
        </div>
        ${info ? `
          <div class="sp-slot-info">
            <span>💰 ${info.budget.toLocaleString('fr-FR')}$</span>
            <span>👥 ${info.population.toLocaleString('fr-FR')}</span>
            <span>😊 ${info.satisfaction}%</span>
            <span>🏗️ ${info.buildingCount}</span>
          </div>
        ` : '<div class="sp-slot-none">Aucune sauvegarde</div>'}
        <div class="sp-slot-actions">
          <button class="sp-btn sp-save" onclick="saveGame(${slot})">💾 Sauvegarder</button>
          ${info ? `
            <button class="sp-btn sp-load" onclick="loadGame(${slot})">📂 Charger</button>
            <button class="sp-btn sp-del" onclick="deleteSave(${slot})">🗑️</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Auto-save info
  const autoInfo = getSaveInfo(0);
  if (autoEl) {
    autoEl.innerHTML = autoInfo ? `
      <div class="sp-auto-info">
        <span class="sp-auto-label">🔄 Auto-save</span>
        <span class="sp-auto-date">${new Date(autoInfo.timestamp).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
        <button class="sp-btn sp-load" onclick="loadGame(0)">📂 Reprendre</button>
      </div>
    ` : '<div class="sp-auto-info"><span class="sp-auto-label">🔄 Pas d\'auto-save encore</span></div>';
  }
}

let savePanelOpen = false;
function toggleSavePanel() {
  savePanelOpen = !savePanelOpen;
  document.getElementById('save-panel')?.classList.toggle('open', savePanelOpen);
  if (savePanelOpen) updateSaveUI();
}
function closeSavePanel() {
  savePanelOpen = false;
  document.getElementById('save-panel')?.classList.remove('open');
}

// ── SAVE BUTTON ──
function buildSaveButton() {
  const btn = document.createElement('button');
  btn.id = 'save-btn';
  btn.className = 'save-topbar-btn';
  btn.title = 'Sauvegardes';
  btn.innerHTML = '💾';
  btn.onclick = toggleSavePanel;

  const topbarRight = document.querySelector('.topbar-right');
  if (topbarRight) topbarRight.prepend(btn);
}

// ── AUTO-SAVE EXTENSION ──
window._gameTickExtensions = window._gameTickExtensions || [];
window._gameTickExtensions.push(function saveTick() {
  if (gameStarted && tick % AUTO_SAVE_INTERVAL === 0 && tick > 0) {
    saveGame(0); // auto-save
  }
});

// ── KEYBOARD SHORTCUTS ──
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 's') { e.preventDefault(); toggleSavePanel(); }
  }
});

// ── STYLES ──
function injectSaveStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Save button in topbar */
    .save-topbar-btn {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(56,92,148,0.2);
      border-radius: 8px; cursor: pointer;
      font-size: 15px; transition: all .15s;
      color: #d8e3f0;
    }
    .save-topbar-btn:hover { background: rgba(34,214,122,0.1); border-color: rgba(34,214,122,0.3); }

    /* Save Panel */
    .save-panel {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -48%) scale(0.95);
      width: min(380px, 94vw);
      z-index: 500;
      background: rgba(8,14,26,0.99);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(56,92,148,0.35);
      border-radius: 16px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.7);
      opacity: 0; pointer-events: none;
      transition: all .3s cubic-bezier(.4,0,.2,1);
    }
    .save-panel.open {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1; pointer-events: all;
    }

    .sp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid rgba(56,92,148,0.2);
    }
    .sp-title {
      display: flex; align-items: center; gap: 6px;
      font-family: 'Exo 2', sans-serif;
      font-size: 12px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 1.5px;
      color: #6b7fa3;
    }
    .sp-close {
      background: none; border: none; color: #6b7fa3;
      cursor: pointer; font-size: 13px;
      padding: 2px 6px; border-radius: 6px; transition: all .15s;
    }
    .sp-close:hover { background: rgba(255,85,85,0.15); color: #ff5555; }

    /* Slots */
    .sp-slots { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }

    .sp-slot {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(56,92,148,0.15);
      border-radius: 10px; padding: 10px 12px;
      transition: border-color .15s;
    }
    .sp-slot:hover { border-color: rgba(56,92,148,0.3); }

    .sp-slot-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .sp-slot-num {
      font-family: 'Exo 2', sans-serif;
      font-size: 12px; font-weight: 800; color: #d8e3f0;
    }
    .sp-slot-date, .sp-slot-empty {
      font-size: 10px; color: #6b7fa3;
    }
    .sp-slot-info {
      display: flex; gap: 8px; flex-wrap: wrap;
      font-size: 11px; color: #6b7fa3; margin-bottom: 8px;
    }
    .sp-slot-info span { font-family: 'Exo 2', sans-serif; font-weight: 600; }
    .sp-slot-none { font-size: 11px; color: #3a4a62; margin-bottom: 8px; font-style: italic; }

    .sp-slot-actions { display: flex; gap: 6px; }
    .sp-btn {
      padding: 5px 10px; border-radius: 7px;
      font-size: 11px; font-weight: 600;
      cursor: pointer; border: 1px solid;
      transition: all .15s; font-family: 'DM Sans', sans-serif;
    }
    .sp-save {
      background: rgba(34,214,122,0.08); border-color: rgba(34,214,122,0.3); color: #22d67a;
    }
    .sp-save:hover { background: rgba(34,214,122,0.18); }
    .sp-load {
      background: rgba(59,158,255,0.08); border-color: rgba(59,158,255,0.3); color: #3b9eff;
    }
    .sp-load:hover { background: rgba(59,158,255,0.18); }
    .sp-del {
      background: rgba(255,85,85,0.07); border-color: rgba(255,85,85,0.25); color: #ff5555;
      padding: 5px 8px;
    }
    .sp-del:hover { background: rgba(255,85,85,0.18); }

    /* Auto-save */
    .sp-autosave { padding: 0 12px 12px; }
    .sp-auto-info {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px;
      background: rgba(255,255,255,0.02);
      border: 1px dashed rgba(56,92,148,0.2);
      border-radius: 8px;
      font-size: 11px; flex-wrap: wrap;
    }
    .sp-auto-label { color: #6b7fa3; font-weight: 600; }
    .sp-auto-date { color: #3b9eff; font-family: 'Exo 2', sans-serif; font-size: 10px; flex: 1; }
  `;
  document.head.appendChild(style);
}

// ── INIT ──
function initSave() {
  injectSaveStyles();
  buildSaveButton();
  buildSavePanel();

  // Offer to load auto-save on start
  const autoInfo = getSaveInfo(0);
  if (autoInfo) {
    const age = Date.now() - autoInfo.timestamp;
    if (age < 1000 * 60 * 60 * 24) { // less than 24h old
      setTimeout(() => {
        showResumePrompt(autoInfo);
      }, 800);
    }
  }
}

function showResumePrompt(info) {
  const date = new Date(info.timestamp).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  const el = document.createElement('div');
  el.className = 'resume-prompt';
  el.innerHTML = `
    <div class="rp-inner">
      <div class="rp-title">🔄 Reprendre la partie ?</div>
      <div class="rp-info">Auto-save du ${date} · ${info.population} hab. · ${info.budget.toLocaleString('fr-FR')}$</div>
      <div class="rp-btns">
        <button onclick="loadGame(0);this.closest('.resume-prompt').remove()" class="rp-yes">Reprendre</button>
        <button onclick="this.closest('.resume-prompt').remove()" class="rp-no">Nouvelle partie</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('visible'), 10);

  const style = document.createElement('style');
  style.textContent = `
    .resume-prompt {
      position: fixed; top: calc(var(--topbar-h, 52px) + 10px); left: 50%;
      transform: translateX(-50%) translateY(-10px);
      z-index: 490; opacity: 0;
      transition: all .35s cubic-bezier(.34,1.56,.64,1);
    }
    .resume-prompt.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    .rp-inner {
      background: rgba(8,14,26,0.98); backdrop-filter: blur(20px);
      border: 1px solid rgba(59,158,255,0.3); border-radius: 12px;
      padding: 14px 18px; text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      min-width: 260px;
    }
    .rp-title { font-family: 'Exo 2',sans-serif; font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .rp-info { font-size: 11px; color: #6b7fa3; margin-bottom: 12px; }
    .rp-btns { display: flex; gap: 8px; justify-content: center; }
    .rp-yes, .rp-no {
      padding: 6px 16px; border-radius: 8px;
      font-size: 12px; font-weight: 700; cursor: pointer;
      font-family: 'DM Sans', sans-serif; border: 1px solid;
      transition: all .15s;
    }
    .rp-yes { background: rgba(59,158,255,0.12); border-color: rgba(59,158,255,0.4); color: #3b9eff; }
    .rp-yes:hover { background: rgba(59,158,255,0.22); }
    .rp-no { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: #6b7fa3; }
    .rp-no:hover { background: rgba(255,255,255,0.08); }
  `;
  document.head.appendChild(style);
}

const _waitSave = setInterval(() => {
  if (typeof gameStarted !== 'undefined') {
    clearInterval(_waitSave);
    initSave();
  }
}, 150);