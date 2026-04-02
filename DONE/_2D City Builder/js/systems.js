// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Systèmes : Criminalité & Pollution
//  Module autonome, s'intègre via extensions
//  Inclure après script.js et events.js
// ═══════════════════════════════════════════════════════

const SystemsModule = (() => {

  // ── ÉTAT ──
  const state = {
    crime:     0,   // 0–100
    pollution: 0,   // 0–100
    lastCrime: 0,
    lastPollution: 0,
  };

  // ── CONFIG : impact par bâtiment ──
  const CRIME_SOURCES = {
    // Bâtiments qui génèrent de la criminalité
    factory: 6, market: 3, shop: 1, airport: 4,
    stadium: 3,
    // Les maisons ne génèrent PAS de crime par elles-mêmes
  };
  const CRIME_REDUCERS = {
    police: 15, fire: 4, school: 5, library: 6,
  };
  const POLLUTION_SOURCES = {
    factory: 12, power: 10, airport: 6,
    road: 0.2, office: 0.5,
  };
  const POLLUTION_REDUCERS = {
    // Les forêts terrain sont comptées séparément avec un cap
    park: 8, solar: 5, windmill: 4,
  };

  // ── CALCUL ──
  function recalcSystems() {
    if (typeof grid === 'undefined') return;

    // Compter les bâtiments par type
    const counts = {};
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const t = grid[y][x].type;
        if (t) counts[t] = (counts[t] || 0) + 1;
      }
    }

    // ── POLLUTION : générée par bâtiments industriels ──
    // Normalisé : 1 usine seule = ~15%, 5 usines = ~50%, 3 centrales = ~25%
    const pollRaw =
      (counts.factory  || 0) * 10 +
      (counts.power    || 0) *  8 +
      (counts.airport  || 0) *  5 +
      (counts.road     || 0) * 0.15 +
      (counts.office   || 0) * 0.3;

    const pollClean =
      (counts.park     || 0) * 5 +
      (counts.solar    || 0) * 4 +
      (counts.windmill || 0) * 3;

    // Forêts terrain : bonus plafonné à 15 pts max (ne peuvent pas tout absorber)
    const forestBonus = Math.min(
      typeof terrainMap !== 'undefined'
        ? (() => { let f=0; for(let y=0;y<GRID;y++) for(let x=0;x<GRID;x++) if(!grid[y][x].type && terrainMap[y]?.[x]==='forest') f++; return f; })()
        : 0,
      15  // cap absolu
    );

    // Bonus tech pollution verte
    const techPollBonus = window._techPollutionBonus || 0;

    state.pollution = clamp(Math.round(pollRaw - pollClean - forestBonus - techPollBonus), 0, 100);

    // ── CRIME : généré par activité économique sans services ──
    const crimeRaw =
      (counts.factory  || 0) * 5 +
      (counts.market   || 0) * 3 +
      (counts.shop     || 0) * 1 +
      (counts.airport  || 0) * 4 +
      (counts.stadium  || 0) * 2;

    const crimeControl =
      (counts.police   || 0) * 14 +
      (counts.fire     || 0) *  3 +
      (counts.school   || 0) *  4 +
      (counts.library  || 0) *  5;

    // Bonus tech sécurité
    const techCrimeBonus = window._techCrimeBonus || 0;

    state.crime = clamp(Math.round(crimeRaw - crimeControl - techCrimeBonus), 0, 100);

    // ── Pénalités satisfaction lues par recalcResources() ──
    window._satPenaltyCrime     = state.crime     > 15 ? Math.floor((state.crime     - 15) * 0.3)  : 0;
    window._satPenaltyPollution = state.pollution > 15 ? Math.floor((state.pollution - 15) * 0.25) : 0;
  }

    // ── EFFET BUDGET (pollution très haute) ──
  function applyEffects() {
    if (state.pollution > 60) {
      const malus = Math.floor((state.pollution - 60) * 0.5);
      budget = Math.max(0, budget - malus);
    }
  }

  // ── ALERTES ──
  let lastCrimeAlert = -999;
  let lastPollAlert  = -999;

  function checkAlerts() {
    if (state.crime > 60 && tick - lastCrimeAlert > 300) {
      lastCrimeAlert = tick;
      notify(`🚨 Criminalité élevée (${state.crime}%) ! Construisez des commissariats.`, 'error');
    } else if (state.crime > 35 && tick - lastCrimeAlert > 600) {
      lastCrimeAlert = tick;
      notify(`⚠️ Montée de la criminalité (${state.crime}%)`, 'error');
    }
    if (state.pollution > 70 && tick - lastPollAlert > 300) {
      lastPollAlert = tick;
      notify(`☣️ Pollution critique (${state.pollution}%) ! Ajoutez des parcs et éoliennes.`, 'error');
    } else if (state.pollution > 40 && tick - lastPollAlert > 600) {
      lastPollAlert = tick;
      notify(`🌫️ Pollution en hausse (${state.pollution}%)`, 'error');
    }
  }

  // ── UI : BARRES DANS LE SIDE PANEL ──
  function buildUI() {
    const panel = document.getElementById('side-panel');
    if (!panel) return;

    const section = document.createElement('div');
    section.className = 'panel-section';
    section.id = 'systems-section';
    section.innerHTML = `
      <div class="panel-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Ordre & Environnement
      </div>
      <div class="bar-group">
        <div class="bar-row">
          <span class="bar-label">🚨 Criminalité</span>
          <span class="bar-val" id="bar-crime-txt">0%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill crime" id="bar-crime" style="width:0%"></div>
        </div>
      </div>
      <div class="bar-group">
        <div class="bar-row">
          <span class="bar-label">🌫️ Pollution</span>
          <span class="bar-val" id="bar-poll-txt">0%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill pollution" id="bar-poll" style="width:0%"></div>
        </div>
      </div>
      <div class="sys-tips" id="sys-tips"></div>
    `;

    // Insérer après la section Ressources
    const resSec = panel.querySelectorAll('.panel-section')[1];
    if (resSec) resSec.after(section);
    else panel.appendChild(section);

    injectStyles();
  }

  function updateUI() {
    const crimeBar  = document.getElementById('bar-crime');
    const pollBar   = document.getElementById('bar-poll');
    const crimeTxt  = document.getElementById('bar-crime-txt');
    const pollTxt   = document.getElementById('bar-poll-txt');
    const tips      = document.getElementById('sys-tips');
    if (!crimeBar) return;

    crimeBar.style.width = state.crime + '%';
    pollBar.style.width  = state.pollution + '%';
    crimeTxt.textContent = state.crime + '%';
    pollTxt.textContent  = state.pollution + '%';

    // Couleur dynamique
    crimeBar.style.background = state.crime > 60 ? '#ef4444'
      : state.crime > 35 ? '#f97316' : '#22d67a';
    pollBar.style.background  = state.pollution > 60 ? '#a855f7'
      : state.pollution > 35 ? '#f97316' : '#22d67a';

    // Conseils contextuels
    const hints = [];
    if (state.crime > 40)     hints.push('🚔 +Commissariat réduit crime');
    if (state.crime > 20)     hints.push('📚 Bibliothèques & écoles aident');
    if (state.pollution > 40) hints.push('🌳 +Parcs/éoliennes contre la pollution');
    if (state.pollution > 20) hints.push('☀️ Solaire pollue moins que Centrale');
    tips.innerHTML = hints.map(h =>
      `<div class="sys-tip">${h}</div>`
    ).join('');
  }

  // ── OVERLAY VISUEL sur la carte ──
  // Teinte rouge sur les tuiles avec beaucoup de sources de crime,
  // teinte grise/violette sur les tuiles avec beaucoup de pollution
  function updateMapOverlay() {
    if (typeof grid === 'undefined') return;

    // Calcul par tuile
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const cell = grid[y][x];
        const t = cell.type;
        if (!t) continue;

        const isCriminal  = (CRIME_SOURCES[t] || 0) >= 2;
        const isPolluter  = (POLLUTION_SOURCES[t] || 0) >= 5;
        const isProtected = (CRIME_REDUCERS[t] || 0) > 0;
        const isGreen     = (POLLUTION_REDUCERS[t] || 0) > 0;

        cell.el.classList.toggle('sys-crime',   isCriminal  && state.crime > 30);
        cell.el.classList.toggle('sys-polluted', isPolluter  && state.pollution > 25);
        cell.el.classList.toggle('sys-protected',isProtected && state.crime > 20);
        cell.el.classList.toggle('sys-green',    isGreen     && state.pollution > 15);
      }
    }
  }

  // ── STYLES ──
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Barres criminalité / pollution */
      .bar-fill.crime     { background: #22d67a; transition: width .4s, background .4s; }
      .bar-fill.pollution { background: #22d67a; transition: width .4s, background .4s; }

      /* Conseils */
      .sys-tips { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
      .sys-tip {
        font-size: 10px; color: #6b7fa3;
        padding: 3px 6px; border-radius: 5px;
        background: rgba(255,255,255,0.02);
        border-left: 2px solid rgba(59,158,255,0.2);
      }

      /* Overlay tuiles */
      .tile.sys-crime::after {
        background: rgba(239,68,68,0.12) !important;
      }
      .tile.sys-polluted::after {
        background: rgba(168,85,247,0.15) !important;
      }
      .tile.sys-crime {
        box-shadow: inset 0 0 0 1px rgba(239,68,68,0.2);
      }
      .tile.sys-polluted {
        box-shadow: inset 0 0 0 1px rgba(168,85,247,0.2);
      }
      .tile.sys-protected {
        box-shadow: inset 0 0 0 1px rgba(99,102,241,0.3);
      }
      .tile.sys-green {
        box-shadow: inset 0 0 0 1px rgba(34,214,122,0.25);
      }

      /* HUD miniature dans la topbar */
      .sys-hud-badge {
        display: flex; align-items: center; gap: 3px;
        font-size: 11px; font-family: 'Exo 2', sans-serif;
        font-weight: 700; padding: 2px 7px;
        border-radius: 6px; cursor: default;
        border: 1px solid rgba(56,92,148,0.2);
        background: rgba(255,255,255,0.03);
        color: #6b7fa3;
        transition: all .3s;
      }
      .sys-hud-badge.warn { border-color: rgba(249,115,22,0.4); color: #f97316; }
      .sys-hud-badge.danger { border-color: rgba(239,68,68,0.4); color: #ef4444; }
    `;
    document.head.appendChild(style);
  }

  // ── HUD TOPBAR BADGES ──
  function buildTopbarBadges() {
    const statsEl = document.getElementById('topbar-stats');
    if (!statsEl) return;

    const crimeBadge = document.createElement('div');
    crimeBadge.id = 'hud-crime';
    crimeBadge.className = 'sys-hud-badge';
    crimeBadge.title = 'Criminalité';
    crimeBadge.innerHTML = '🚨 <span id="hud-crime-val">0%</span>';

    const pollBadge = document.createElement('div');
    pollBadge.id = 'hud-poll';
    pollBadge.className = 'sys-hud-badge';
    pollBadge.title = 'Pollution';
    pollBadge.innerHTML = '🌫️ <span id="hud-poll-val">0%</span>';

    statsEl.appendChild(crimeBadge);
    statsEl.appendChild(pollBadge);
  }

  function updateTopbarBadges() {
    const cv = document.getElementById('hud-crime-val');
    const pv = document.getElementById('hud-poll-val');
    const cb = document.getElementById('hud-crime');
    const pb = document.getElementById('hud-poll');
    if (!cv) return;

    cv.textContent = state.crime + '%';
    pv.textContent = state.pollution + '%';

    cb.className = 'sys-hud-badge' +
      (state.crime > 60 ? ' danger' : state.crime > 30 ? ' warn' : '');
    pb.className = 'sys-hud-badge' +
      (state.pollution > 60 ? ' danger' : state.pollution > 30 ? ' warn' : '');
  }

  // ── INIT ──
  function init() {
    buildUI();
    buildTopbarBadges();
  }

  // ── TICK EXTENSION ──
  window._gameTickExtensions = window._gameTickExtensions || [];
  window._gameTickExtensions.push(function systemsTick() {
    if (!gameStarted) return;

    if (tick % 30 === 0) {
      recalcSystems();
      updateUI();
      updateTopbarBadges();
      updateMapOverlay();
    }
    if (tick % 60 === 0) {
      applyEffects();
    }
    if (tick % 120 === 0) {
      checkAlerts();
    }
  });

  // ── API publique ──
  return { init, getState: () => ({ ...state }) };

})();

// ── ATTENDRE QUE LE JEU SOIT PRÊT ──
const _waitSystems = setInterval(() => {
  if (typeof gameStarted !== 'undefined' && typeof grid !== 'undefined' &&
      typeof satisfaction !== 'undefined' && typeof notify === 'function') {
    clearInterval(_waitSystems);
    SystemsModule.init();
  }
}, 100);