// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Journal des Événements & Statistiques
//  Historique, graphiques budget/pop/satisfaction
//  Inclure après script.js
// ═══════════════════════════════════════════════════════

// ── STATE ──
const journalState = {
  entries: [],       // { time, icon, msg, type }
  maxEntries: 60,
  history: {         // time-series for charts
    budget: [],
    population: [],
    satisfaction: [],
    maxPoints: 60,
  },
  open: false,
};

// ── ADD ENTRY ──
function addJournalEntry(icon, msg, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  journalState.entries.unshift({ time, icon, msg, type, tick });
  if (journalState.entries.length > journalState.maxEntries) {
    journalState.entries.pop();
  }
  updateJournalList();
  updateJournalBadge();
}

// ── PATCH notify to also log ──
const _origNotify = window.notify;
window.notify = function(msg, type = 'error') {
  _origNotify(msg, type);
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
  addJournalEntry(icons[type] || 'ℹ️', msg, type);
};

// ── RECORD HISTORY (called every ~60 ticks) ──
function recordHistory() {
  const h = journalState.history;
  h.budget.push(budget);
  h.population.push(population);
  h.satisfaction.push(satisfaction);
  if (h.budget.length > h.maxPoints) {
    h.budget.shift(); h.population.shift(); h.satisfaction.shift();
  }
  if (journalState.open) renderCharts();
}

// ── BUILD JOURNAL PANEL ──
function buildJournalPanel() {
  const panel = document.createElement('div');
  panel.id = 'journal-panel';
  panel.className = 'journal-panel';
  panel.innerHTML = `
    <div class="jp-header">
      <div class="jp-tabs">
        <button class="jp-tab active" data-tab="journal" onclick="switchJournalTab('journal',this)">
          📋 Journal
        </button>
        <button class="jp-tab" data-tab="stats" onclick="switchJournalTab('stats',this)">
          📊 Stats
        </button>
      </div>
      <button class="jp-close" onclick="toggleJournal()">✕</button>
    </div>

    <!-- Journal Tab -->
    <div id="jp-tab-journal" class="jp-tab-content active">
      <div class="jp-entries" id="jp-entries">
        <div class="jp-empty">Aucun événement pour l'instant…</div>
      </div>
    </div>

    <!-- Stats Tab -->
    <div id="jp-tab-stats" class="jp-tab-content">
      <div class="jp-stats-scroll">
        <div class="jp-stat-card">
          <div class="jp-stat-title">💰 Budget</div>
          <div class="jp-stat-val" id="jstat-budget">—</div>
          <canvas class="jp-chart" id="chart-budget" height="60"></canvas>
        </div>
        <div class="jp-stat-card">
          <div class="jp-stat-title">👥 Population</div>
          <div class="jp-stat-val" id="jstat-pop">—</div>
          <canvas class="jp-chart" id="chart-pop" height="60"></canvas>
        </div>
        <div class="jp-stat-card">
          <div class="jp-stat-title">😊 Satisfaction</div>
          <div class="jp-stat-val" id="jstat-sat">—</div>
          <canvas class="jp-chart" id="chart-sat" height="60"></canvas>
        </div>
        <div class="jp-stat-card">
          <div class="jp-stat-title">🏗️ Bâtiments</div>
          <div class="jp-stat-grid" id="jstat-buildings"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Journal toggle button (in topbar right area or as floating button)
  const btn = document.createElement('button');
  btn.id = 'journal-btn';
  btn.className = 'journal-btn';
  btn.title = 'Journal & Stats';
  btn.innerHTML = `📋 <span class="journal-badge" id="journal-badge">0</span>`;
  btn.onclick = toggleJournal;

  const topbarRight = document.querySelector('.topbar-right');
  if (topbarRight) topbarRight.prepend(btn);
}

function switchJournalTab(tab, btnEl) {
  document.querySelectorAll('.jp-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.jp-tab-content').forEach(c => c.classList.remove('active'));
  btnEl.classList.add('active');
  document.getElementById(`jp-tab-${tab}`)?.classList.add('active');
  if (tab === 'stats') renderCharts();
}

let journalUnread = 0;

function toggleJournal() {
  journalState.open = !journalState.open;
  document.getElementById('journal-panel')?.classList.toggle('open', journalState.open);
  if (journalState.open) {
    journalUnread = 0;
    updateJournalBadge();
    renderCharts();
    renderBuildingStats();
  }
}

function updateJournalBadge() {
  if (!journalState.open) journalUnread++;
  const badge = document.getElementById('journal-badge');
  if (badge) {
    badge.textContent = journalUnread > 0 ? journalUnread : '';
    badge.style.display = journalUnread > 0 ? 'inline' : 'none';
  }
}

function updateJournalList() {
  const list = document.getElementById('jp-entries');
  if (!list) return;

  if (journalState.entries.length === 0) {
    list.innerHTML = '<div class="jp-empty">Aucun événement pour l\'instant…</div>';
    return;
  }

  list.innerHTML = journalState.entries.map(e => `
    <div class="jp-entry jp-entry-${e.type}">
      <span class="je-icon">${e.icon}</span>
      <div class="je-body">
        <span class="je-msg">${e.msg}</span>
        <span class="je-time">${e.time}</span>
      </div>
    </div>
  `).join('');
}

// ── CHARTS ──
function renderCharts() {
  const h = journalState.history;
  if (h.budget.length === 0) return;

  renderLineChart('chart-budget', h.budget, '#fbbf24', 'jstat-budget',
    budget.toLocaleString('fr-FR') + ' $');
  renderLineChart('chart-pop', h.population, '#3b9eff', 'jstat-pop',
    population.toLocaleString('fr-FR') + ' hab.');
  renderLineChart('chart-sat', h.satisfaction, '#22d67a', 'jstat-sat',
    satisfaction + '%');
}

function renderLineChart(canvasId, data, color, valId, valText) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 220;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = (h - 4) * (1 - i / 3) + 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Last point dot
  const lx = w, ly = h - 4 - ((data[data.length-1] - min) / range) * (h - 8);
  ctx.beginPath();
  ctx.arc(lx - 2, ly, 3, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();

  // Value text
  const valEl = document.getElementById(valId);
  if (valEl) valEl.textContent = valText;
}

function renderBuildingStats() {
  const el = document.getElementById('jstat-buildings');
  if (!el) return;

  const allTypes = Object.keys(BUILDINGS);
  const counts = allTypes.map(t => ({ type: t, count: countBuildingType(t), info: BUILDINGS[t] }))
    .filter(b => b.count > 0)
    .sort((a, b) => b.count - a.count);

  if (counts.length === 0) {
    el.innerHTML = '<span style="color:#6b7fa3;font-size:12px">Aucun bâtiment</span>';
    return;
  }

  el.innerHTML = counts.map(b => `
    <div class="jstat-b-item">
      <span class="jstat-b-icon">${b.info.emoji || '🛣️'}</span>
      <span class="jstat-b-label">${b.info.label}</span>
      <span class="jstat-b-count">×${b.count}</span>
    </div>
  `).join('');
}

// ── PATCH GAME TICK ──
window._gameTickExtensions = window._gameTickExtensions || [];
window._gameTickExtensions.push(function journalTick() {
  if (gameStarted && tick % 60 === 0) {
    recordHistory();
    if (journalState.open) renderBuildingStats();
  }
});

// ── STYLES ──
function injectJournalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Journal Button */
    .journal-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 8px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(56,92,148,0.2);
      color: #d8e3f0; font-size: 13px;
      cursor: pointer; transition: all .15s;
      position: relative;
    }
    .journal-btn:hover { background: rgba(59,158,255,0.08); border-color: rgba(59,158,255,0.3); }
    .journal-badge {
      background: #ef4444; color: #fff;
      font-size: 9px; font-weight: 800;
      padding: 1px 5px; border-radius: 10px;
      font-family: 'Exo 2', sans-serif;
    }

    /* Journal Panel */
    .journal-panel {
      position: fixed;
      bottom: calc(var(--toolbar-h, 76px) + 10px);
      right: 10px;
      width: 300px;
      max-height: 480px;
      z-index: 190;
      background: rgba(8,14,26,0.98);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(56,92,148,0.3);
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: all .3s cubic-bezier(.4,0,.2,1);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .journal-panel.open {
      transform: translateY(0) scale(1);
      opacity: 1; pointer-events: all;
    }

    /* Header */
    .jp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(56,92,148,0.2);
      background: rgba(10,18,32,0.8);
      flex-shrink: 0;
    }
    .jp-tabs { display: flex; gap: 4px; }
    .jp-tab {
      padding: 5px 12px; border-radius: 8px;
      background: transparent; border: 1px solid transparent;
      color: #6b7fa3; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all .15s;
      font-family: 'DM Sans', sans-serif;
    }
    .jp-tab.active {
      background: rgba(59,158,255,0.1);
      border-color: rgba(59,158,255,0.3);
      color: #3b9eff;
    }
    .jp-tab:hover:not(.active) { background: rgba(255,255,255,0.04); color: #d8e3f0; }
    .jp-close {
      background: none; border: none; color: #6b7fa3;
      cursor: pointer; font-size: 13px;
      padding: 2px 6px; border-radius: 6px; transition: all .15s;
    }
    .jp-close:hover { background: rgba(255,85,85,0.15); color: #ff5555; }

    /* Tab Content */
    .jp-tab-content { display: none; flex: 1; overflow: hidden; }
    .jp-tab-content.active { display: flex; flex-direction: column; }

    /* Entries */
    .jp-entries {
      flex: 1; overflow-y: auto;
      padding: 8px;
      display: flex; flex-direction: column; gap: 4px;
      scrollbar-width: thin;
      scrollbar-color: rgba(59,158,255,0.2) transparent;
    }
    .jp-empty { padding: 20px; text-align: center; color: #6b7fa3; font-size: 12px; }

    .jp-entry {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 8px 10px; border-radius: 8px;
      background: rgba(255,255,255,0.02);
      border-left: 2px solid;
      transition: background .15s;
    }
    .jp-entry:hover { background: rgba(255,255,255,0.04); }
    .jp-entry-error  { border-left-color: #ff5555; }
    .jp-entry-success{ border-left-color: #22d67a; }
    .jp-entry-info   { border-left-color: #3b9eff; }

    .je-icon { font-size: 14px; flex-shrink: 0; line-height: 1.4; }
    .je-body { flex: 1; min-width: 0; }
    .je-msg { font-size: 12px; color: #d8e3f0; display: block; line-height: 1.4; }
    .je-time { font-size: 10px; color: #6b7fa3; font-family: 'Exo 2', sans-serif; }

    /* Stats */
    .jp-stats-scroll {
      flex: 1; overflow-y: auto; padding: 8px;
      display: flex; flex-direction: column; gap: 8px;
      scrollbar-width: thin;
      scrollbar-color: rgba(59,158,255,0.2) transparent;
    }
    .jp-stat-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(56,92,148,0.15);
      border-radius: 10px; padding: 10px 12px;
    }
    .jp-stat-title {
      font-size: 11px; color: #6b7fa3;
      font-weight: 600; margin-bottom: 4px;
    }
    .jp-stat-val {
      font-family: 'Exo 2', sans-serif;
      font-size: 18px; font-weight: 800;
      color: #fff; margin-bottom: 8px;
    }
    .jp-chart { width: 100%; display: block; border-radius: 4px; }

    /* Building stats grid */
    .jp-stat-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
      max-height: 120px; overflow-y: auto;
    }
    .jstat-b-item {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 6px; border-radius: 6px;
      background: rgba(255,255,255,0.03);
      font-size: 11px;
    }
    .jstat-b-icon { font-size: 13px; }
    .jstat-b-label { flex: 1; color: #6b7fa3; font-size: 10px; }
    .jstat-b-count { font-family: 'Exo 2', sans-serif; font-weight: 700; color: #3b9eff; font-size: 11px; }

    @media (max-width: 700px) {
      .journal-panel { right: 0; bottom: calc(var(--toolbar-h, 76px) + 6px); width: 100vw; border-radius: 14px 14px 0 0; max-height: 60vh; }
      .journal-btn span:first-child { font-size: 16px; }
    }
  `;
  document.head.appendChild(style);
}

// ── INIT ──
function initJournal() {
  injectJournalStyles();
  buildJournalPanel();
  addJournalEntry('🏙️', 'Partie commencée ! Construisez votre première route.', 'info');
}

const _waitJournal = setInterval(() => {
  if (typeof gameStarted !== 'undefined') {
    clearInterval(_waitJournal);
    initJournal();
  }
}, 150);