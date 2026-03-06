// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Missions & Objectifs
//  Inclure après script.js et events.js
// ═══════════════════════════════════════════════════════

const MISSIONS = [
  // ── TIER 1 : Village ──
  {
    id: 'first_road',
    tier: 1, title: 'Premier Pas',
    desc: 'Construisez votre première route.',
    icon: '🛣️',
    check: () => countBuildingType('road') >= 1,
    reward: { budget: 200, label: '+200$' },
  },
  {
    id: 'first_house',
    tier: 1, title: 'Bienvenue chez vous',
    desc: 'Construisez votre première maison.',
    icon: '🏠',
    check: () => countBuildingType('house') >= 1,
    reward: { budget: 300, label: '+300$' },
  },
  {
    id: 'pop_50',
    tier: 1, title: 'Hameau',
    desc: 'Atteignez 50 habitants.',
    icon: '👥',
    check: () => population >= 50,
    reward: { budget: 500, label: '+500$' },
  },
  {
    id: 'first_power',
    tier: 1, title: 'Lumière !',
    desc: 'Construisez une centrale ou un panneau solaire.',
    icon: '⚡',
    check: () => countBuildingType('power') >= 1 || countBuildingType('solar') >= 1,
    reward: { budget: 400, label: '+400$' },
  },
  {
    id: 'first_water',
    tier: 1, title: 'L\'eau courante',
    desc: 'Construisez un château d\'eau.',
    icon: '💧',
    check: () => countBuildingType('water') >= 1,
    reward: { budget: 400, label: '+400$' },
  },

  // ── TIER 2 : Bourg ──
  {
    id: 'pop_200',
    tier: 2, title: 'Bourg',
    desc: 'Atteignez 200 habitants.',
    icon: '🏘️',
    check: () => population >= 200,
    reward: { budget: 1000, label: '+1 000$' },
  },
  {
    id: 'happy_70',
    tier: 2, title: 'Ville heureuse',
    desc: 'Atteignez 70% de satisfaction.',
    icon: '😊',
    check: () => satisfaction >= 70,
    reward: { budget: 800, label: '+800$' },
  },
  {
    id: 'budget_5000',
    tier: 2, title: 'Épargnant',
    desc: 'Ayez 5 000$ en caisse simultanément.',
    icon: '💰',
    check: () => budget >= 5000,
    reward: { budget: 600, label: '+600$' },
  },
  {
    id: 'roads_20',
    tier: 2, title: 'Réseau routier',
    desc: 'Construisez 20 routes.',
    icon: '🗺️',
    check: () => countBuildingType('road') >= 20,
    reward: { budget: 500, label: '+500$' },
  },
  {
    id: 'park_3',
    tier: 2, title: 'Ville verte',
    desc: 'Construisez 3 parcs.',
    icon: '🌳',
    check: () => countBuildingType('park') >= 3,
    reward: { budget: 600, label: '+600$' },
  },
  {
    id: 'safety',
    tier: 2, title: 'Force de l\'ordre',
    desc: 'Construisez une caserne de pompiers ET un commissariat.',
    icon: '🚔',
    check: () => countBuildingType('fire') >= 1 && countBuildingType('police') >= 1,
    reward: { budget: 900, label: '+900$' },
  },

  // ── TIER 3 : Ville ──
  {
    id: 'pop_500',
    tier: 3, title: 'Ville',
    desc: 'Atteignez 500 habitants.',
    icon: '🏙️',
    check: () => population >= 500,
    reward: { budget: 2000, label: '+2 000$' },
  },
  {
    id: 'budget_20000',
    tier: 3, title: 'Prospérité',
    desc: 'Accumulez 20 000$ en caisse.',
    icon: '🤑',
    check: () => budget >= 20000,
    reward: { budget: 2500, label: '+2 500$' },
  },
  {
    id: 'education',
    tier: 3, title: 'Savoir & Santé',
    desc: 'Construisez une école, une bibliothèque et un hôpital.',
    icon: '🎓',
    check: () => countBuildingType('school') >= 1 && countBuildingType('library') >= 1 && countBuildingType('hospital') >= 1,
    reward: { budget: 1500, label: '+1 500$' },
  },
  {
    id: 'green_energy',
    tier: 3, title: 'Ville verte',
    desc: 'Ayez 2 panneaux solaires ET 2 éoliennes.',
    icon: '♻️',
    check: () => countBuildingType('solar') >= 2 && countBuildingType('windmill') >= 2,
    reward: { budget: 2000, label: '+2 000$' },
  },
  {
    id: 'economy',
    tier: 3, title: 'Économie florissante',
    desc: 'Avoir 3 commerces, 2 bureaux et 1 marché.',
    icon: '📈',
    check: () => countBuildingType('shop') >= 3 && countBuildingType('office') >= 2 && countBuildingType('market') >= 1,
    reward: { budget: 1800, label: '+1 800$' },
  },

  // ── TIER 4 : Métropole ──
  {
    id: 'pop_1000',
    tier: 4, title: 'Métropole',
    desc: 'Atteignez 1 000 habitants.',
    icon: '🌆',
    check: () => population >= 1000,
    reward: { budget: 5000, label: '+5 000$' },
  },
  {
    id: 'airport_built',
    tier: 4, title: 'Hub international',
    desc: 'Construisez un aéroport.',
    icon: '✈️',
    check: () => countBuildingType('airport') >= 1,
    reward: { budget: 4000, label: '+4 000$' },
  },
  {
    id: 'stadium_built',
    tier: 4, title: 'Temple du sport',
    desc: 'Construisez un stade.',
    icon: '🏟️',
    check: () => countBuildingType('stadium') >= 1,
    reward: { budget: 3000, label: '+3 000$' },
  },
  {
    id: 'happy_90',
    tier: 4, title: 'Paradis urbain',
    desc: 'Atteignez 90% de satisfaction.',
    icon: '🌟',
    check: () => satisfaction >= 90,
    reward: { budget: 5000, label: '+5 000$' },
  },
  {
    id: 'budget_100000',
    tier: 4, title: 'Trésor de guerre',
    desc: 'Accumulez 100 000$ en caisse.',
    icon: '💎',
    check: () => budget >= 100000,
    reward: { budget: 10000, label: '+10 000$' },
  },
];

// ── CITY RANKS ──
const CITY_RANKS = [
  { min: 0,    label: 'Campement',  icon: '⛺', color: '#6b7fa3' },
  { min: 50,   label: 'Hameau',     icon: '🏚️', color: '#22d3ee' },
  { min: 150,  label: 'Village',    icon: '🏘️', color: '#22d67a' },
  { min: 400,  label: 'Bourg',      icon: '🏠', color: '#3b9eff' },
  { min: 800,  label: 'Ville',      icon: '🏙️', color: '#a855f7' },
  { min: 1500, label: 'Grande Ville', icon: '🌆', color: '#fbbf24' },
  { min: 3000, label: 'Métropole',  icon: '🌇', color: '#ff9f43' },
  { min: 6000, label: 'Mégalopole', icon: '🌃', color: '#ef4444' },
  { min: 10000,label: 'Capitale',   icon: '👑', color: '#ffd700' },
];

// ── STATE ──
const missionState = {
  completed: new Set(),
  active: [],
};

// ── HELPERS ──
function getCurrentRank() {
  let rank = CITY_RANKS[0];
  for (const r of CITY_RANKS) {
    if (population >= r.min) rank = r;
    else break;
  }
  return rank;
}

function getNextRank() {
  for (const r of CITY_RANKS) {
    if (population < r.min) return r;
  }
  return null;
}

// ── MISSION CHECK (called every tick) ──
function checkMissions() {
  for (const m of MISSIONS) {
    if (missionState.completed.has(m.id)) continue;
    if (m.check()) {
      completeMission(m, gameStarted); // no toast on first silent load
    }
  }
  updateMissionPanel();
  updateRankUI();
}

function completeMission(m, showToast = true) {
  missionState.completed.add(m.id);

  // Apply reward
  if (m.reward.budget) budget += m.reward.budget;

  // Visual feedback only during active game
  if (showToast) {
    showMissionComplete(m);
    notify(`🏆 ${m.title} — ${m.reward.label}`, 'success');
  }

  recalcResources();
  updateUI();
}

function showMissionComplete(m) {
  // Big reward toast
  const el = document.createElement('div');
  el.className = 'mission-toast';
  el.innerHTML = `
    <div class="mt-icon">${m.icon}</div>
    <div class="mt-body">
      <div class="mt-title">Mission accomplie !</div>
      <div class="mt-name">${m.title}</div>
      <div class="mt-reward">${m.reward.label}</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('visible'), 10);
  setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 500); }, 3500);
}

// ── PANEL UI ──
function buildMissionPanel() {
  const panel = document.createElement('div');
  panel.id = 'mission-panel';
  panel.className = 'mission-panel';
  panel.innerHTML = `
    <div class="mp-header">
      <div class="mp-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Missions
      </div>
      <button class="mp-close" onclick="toggleMissionPanel()">✕</button>
    </div>
    <div class="mp-rank-section">
      <div class="mp-rank" id="mp-rank">
        <span class="rank-icon">⛺</span>
        <div class="rank-info">
          <span class="rank-label" id="rank-label">Campement</span>
          <div class="rank-progress-wrap">
            <div class="rank-progress-bar"><div class="rank-progress-fill" id="rank-fill"></div></div>
            <span class="rank-progress-txt" id="rank-progress-txt">0 / 50 hab.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="mp-list" id="mp-list"></div>
  `;

  // Insert into side panel
  const sidePanel = document.getElementById('side-panel');
  if (sidePanel) sidePanel.appendChild(panel);

  updateMissionPanel();
}

function updateMissionPanel() {
  const list = document.getElementById('mp-list');
  if (!list) return;

  // Show active (incomplete) missions, max 5
  const incomplete = MISSIONS.filter(m => !missionState.completed.has(m.id));
  const toShow = incomplete.slice(0, 5);

  list.innerHTML = toShow.map(m => {
    const prog = getMissionProgress(m);
    return `
      <div class="mp-item tier-${m.tier}">
        <span class="mp-item-icon">${m.icon}</span>
        <div class="mp-item-body">
          <div class="mp-item-title">${m.title}</div>
          <div class="mp-item-desc">${m.desc}</div>
          ${prog ? `<div class="mp-item-prog">${prog}</div>` : ''}
        </div>
        <div class="mp-item-reward">${m.reward.label}</div>
      </div>
    `;
  }).join('');

  if (toShow.length === 0) {
    list.innerHTML = '<div class="mp-done">🏆 Toutes les missions accomplies !</div>';
  }

  const doneCount = missionState.completed.size;
  const totalCount = MISSIONS.length;
  const btn = document.getElementById('mission-btn-count');
  if (btn) btn.textContent = `${doneCount}/${totalCount}`;
}

function getMissionProgress(m) {
  // Return a progress string for missions with numeric goals
  if (m.id.startsWith('pop_')) {
    const target = parseInt(m.id.split('_')[1]);
    return `${Math.min(population, target).toLocaleString('fr-FR')} / ${target.toLocaleString('fr-FR')} hab.`;
  }
  if (m.id.startsWith('budget_')) {
    const target = parseInt(m.id.split('_')[1]);
    return `${Math.min(budget, target).toLocaleString('fr-FR')} / ${target.toLocaleString('fr-FR')} $`;
  }
  if (m.id === 'roads_20') return `${Math.min(countBuildingType('road'), 20)} / 20 routes`;
  if (m.id === 'park_3')   return `${Math.min(countBuildingType('park'), 3)} / 3 parcs`;
  return null;
}

function updateRankUI() {
  const rank = getCurrentRank();
  const next = getNextRank();
  const labelEl = document.getElementById('rank-label');
  const iconEl = document.querySelector('.rank-icon');
  const fillEl = document.getElementById('rank-fill');
  const txtEl = document.getElementById('rank-progress-txt');
  if (!labelEl) return;

  labelEl.textContent = rank.label;
  labelEl.style.color = rank.color;
  if (iconEl) iconEl.textContent = rank.icon;

  if (next && fillEl && txtEl) {
    const pct = Math.min(100, ((population - rank.min) / (next.min - rank.min)) * 100);
    fillEl.style.width = pct + '%';
    fillEl.style.background = rank.color;
    txtEl.textContent = `${population.toLocaleString('fr-FR')} / ${next.min.toLocaleString('fr-FR')} hab.`;
  } else if (fillEl) {
    fillEl.style.width = '100%';
    if (txtEl) txtEl.textContent = 'Rang maximal ! 👑';
  }

  // Update topbar rank badge
  const badge = document.getElementById('rank-badge');
  if (badge) {
    badge.textContent = `${rank.icon} ${rank.label}`;
    badge.style.color = rank.color;
    badge.style.borderColor = rank.color + '55';
    badge.style.background = rank.color + '11';
  }
}

// ── TOGGLE PANEL ──
let missionPanelOpen = false;
function toggleMissionPanel() {
  missionPanelOpen = !missionPanelOpen;
  document.getElementById('mission-panel')?.classList.toggle('open', missionPanelOpen);
}

// ── TOOLBAR MISSION BUTTON ──
function buildMissionButton() {
  // Rank badge in topbar
  const badge = document.createElement('div');
  badge.id = 'rank-badge';
  badge.className = 'rank-badge';
  badge.textContent = '⛺ Campement';
  badge.onclick = toggleMissionPanel;
  const topbarLeft = document.querySelector('.topbar-left');
  if (topbarLeft) topbarLeft.appendChild(badge);

  // Mission count overlay on badge
  const countSpan = document.createElement('span');
  countSpan.id = 'mission-btn-count';
  countSpan.className = 'mission-count';
  countSpan.textContent = `0/${MISSIONS.length}`;
  badge.appendChild(countSpan);
}

// ── INJECT STYLES ──
function injectMissionStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Rank Badge in Topbar */
    .rank-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 8px;
      font-family: 'Exo 2', sans-serif;
      font-size: 11px; font-weight: 700;
      letter-spacing: .5px;
      border: 1px solid rgba(107,127,163,0.3);
      background: rgba(107,127,163,0.08);
      color: #6b7fa3;
      cursor: pointer;
      transition: all .2s;
      white-space: nowrap;
      position: relative;
    }
    .rank-badge:hover { filter: brightness(1.2); transform: scale(1.03); }
    .mission-count {
      font-size: 9px; font-weight: 800;
      background: rgba(255,255,255,0.08);
      padding: 1px 5px; border-radius: 10px;
      color: #6b7fa3; margin-left: 2px;
    }

    /* Mission Panel */
    .mission-panel {
      position: fixed;
      top: calc(var(--topbar-h) + 10px);
      left: 10px;
      width: 260px;
      max-height: calc(100vh - var(--topbar-h) - 90px);
      overflow-y: auto;
      z-index: 151;
      background: rgba(10, 16, 30, 0.97);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(56,92,148,0.3);
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      transform: translateX(-110%);
      transition: transform .35s cubic-bezier(.4,0,.2,1);
      scrollbar-width: thin;
      scrollbar-color: rgba(59,158,255,0.2) transparent;
    }
    .mission-panel.open { transform: translateX(0); }

    .mp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 14px 10px;
      border-bottom: 1px solid rgba(56,92,148,0.2);
      position: sticky; top: 0;
      background: rgba(10,16,30,0.98);
      z-index: 1;
    }
    .mp-title {
      display: flex; align-items: center; gap: 6px;
      font-family: 'Exo 2', sans-serif;
      font-size: 11px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 2px;
      color: #6b7fa3;
    }
    .mp-close {
      background: none; border: none;
      color: #6b7fa3; cursor: pointer;
      font-size: 14px; padding: 2px 6px;
      border-radius: 6px;
      transition: all .15s;
    }
    .mp-close:hover { background: rgba(255,85,85,0.15); color: #ff5555; }

    /* Rank Section */
    .mp-rank-section { padding: 12px 14px; border-bottom: 1px solid rgba(56,92,148,0.15); }
    .mp-rank { display: flex; align-items: center; gap: 10px; }
    .rank-icon { font-size: 28px; line-height: 1; }
    .rank-info { flex: 1; }
    .rank-label {
      font-family: 'Exo 2', sans-serif;
      font-size: 14px; font-weight: 800;
      display: block; margin-bottom: 4px;
    }
    .rank-progress-wrap { display: flex; align-items: center; gap: 6px; }
    .rank-progress-bar {
      flex: 1; height: 4px; border-radius: 2px;
      background: rgba(255,255,255,0.06);
      overflow: hidden;
    }
    .rank-progress-fill {
      height: 100%; border-radius: 2px;
      transition: width .6s ease;
    }
    .rank-progress-txt { font-size: 10px; color: #6b7fa3; white-space: nowrap; }

    /* Mission List */
    .mp-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }

    .mp-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 10px;
      border-radius: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-left: 3px solid;
      transition: background .15s;
    }
    .mp-item:hover { background: rgba(255,255,255,0.06); }
    .mp-item.tier-1 { border-left-color: #22d3ee; }
    .mp-item.tier-2 { border-left-color: #22d67a; }
    .mp-item.tier-3 { border-left-color: #3b9eff; }
    .mp-item.tier-4 { border-left-color: #fbbf24; }

    .mp-item-icon { font-size: 18px; line-height: 1; flex-shrink: 0; margin-top: 1px; }
    .mp-item-body { flex: 1; min-width: 0; }
    .mp-item-title {
      font-family: 'Exo 2', sans-serif;
      font-size: 12px; font-weight: 700;
      color: #d8e3f0; margin-bottom: 2px;
    }
    .mp-item-desc { font-size: 11px; color: #6b7fa3; line-height: 1.4; }
    .mp-item-prog { font-size: 10px; color: #3b9eff; margin-top: 3px; font-weight: 600; }
    .mp-item-reward {
      font-family: 'Exo 2', sans-serif;
      font-size: 11px; font-weight: 800;
      color: #fbbf24;
      flex-shrink: 0; white-space: nowrap;
    }
    .mp-done { padding: 20px; text-align: center; color: #6b7fa3; font-size: 13px; }

    /* Mission Complete Toast */
    .mission-toast {
      position: fixed;
      bottom: calc(var(--toolbar-h, 76px) + 12px);
      left: 50%; transform: translateX(-50%) translateY(20px);
      z-index: 450;
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px;
      background: rgba(10,20,35,0.98);
      border: 1px solid rgba(251,191,36,0.4);
      border-radius: 14px;
      box-shadow: 0 8px 40px rgba(251,191,36,0.15), 0 0 0 1px rgba(251,191,36,0.1);
      opacity: 0;
      transition: all .4s cubic-bezier(.34,1.56,.64,1);
      min-width: 240px; max-width: 320px;
      pointer-events: none;
    }
    .mission-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    .mt-icon { font-size: 32px; line-height: 1; flex-shrink: 0; }
    .mt-body { flex: 1; }
    .mt-title {
      font-size: 9px; font-weight: 800; letter-spacing: 2px;
      text-transform: uppercase; color: #fbbf24; margin-bottom: 2px;
    }
    .mt-name {
      font-family: 'Exo 2', sans-serif;
      font-size: 15px; font-weight: 800;
      color: #fff; margin-bottom: 2px;
    }
    .mt-reward {
      font-family: 'Exo 2', sans-serif;
      font-size: 13px; font-weight: 700; color: #22d67a;
    }

    @media (max-width: 700px) {
      .mission-panel { left: 0; top: var(--topbar-h); border-radius: 0 0 14px 0; width: 260px; }
      .rank-badge span:not(.mission-count) { display: none; }
      .rank-badge { padding: 4px 8px; }
    }
  `;
  document.head.appendChild(style);
}

// ── MISSIONS TICK EXTENSION ──
window._gameTickExtensions = window._gameTickExtensions || [];
window._gameTickExtensions.push(function missionsTick() {
  if (gameStarted && tick % 10 === 0) checkMissions();
});

// ── INIT ──
function initMissions() {
  injectMissionStyles();
  buildMissionButton();
  buildMissionPanel();
  checkMissions();
}

const _waitMissions = setInterval(() => {
  if (typeof gameStarted !== 'undefined' && typeof population !== 'undefined') {
    clearInterval(_waitMissions);
    initMissions();
  }
}, 150);