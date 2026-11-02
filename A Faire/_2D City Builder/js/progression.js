// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Progression : Arbre Tech & Succès
//  Inclure après script.js, events.js, systems.js
// ═══════════════════════════════════════════════════════

const ProgressionModule = (() => {

  // ══════════════════════════════════════════
  //  ARBRE TECHNOLOGIQUE
  // ══════════════════════════════════════════

  const TECHS = [
    {
      id: 'green_energy',
      name: 'Énergie Verte',
      icon: '☀️',
      desc: 'Solaire & éoliennes −30% coût, +50% production.',
      cost: 1500,
      requires: [],
      effect() {
        BUILDINGS.solar.cost    = Math.round(BUILDINGS.solar.cost    * 0.7);
        BUILDINGS.windmill.cost = Math.round(BUILDINGS.windmill.cost * 0.7);
        BUILDINGS.solar.pG    = Math.round(BUILDINGS.solar.pG    * 1.5);
        BUILDINGS.windmill.pG = Math.round(BUILDINGS.windmill.pG * 1.5);
        // Réduction pollution par tick (via systems.js si présent)
        if (typeof SystemsModule !== 'undefined') {
          window._techPollutionBonus = (window._techPollutionBonus || 0) + 8;
        }
      },
      effectDesc: ['☀️ Solaire: −30% coût', '💨 Éolienne: −30% coût', '⚡ Production +50%'],
    },
    {
      id: 'urbanisme',
      name: 'Urbanisme Avancé',
      icon: '🏙️',
      desc: 'Maisons & bureaux génèrent +40% revenus et +2 satisfaction.',
      cost: 2000,
      requires: [],
      effect() {
        BUILDINGS.house.income  = Math.round(BUILDINGS.house.income  * 1.4);
        BUILDINGS.office.income = Math.round(BUILDINGS.office.income * 1.4);
        BUILDINGS.shop.income   = Math.round(BUILDINGS.shop.income   * 1.4);
        BUILDINGS.house.happy  += 2;
        BUILDINGS.office.happy += 1;
      },
      effectDesc: ['🏠 Revenu maison +40%', '🏢 Revenu bureau +40%', '🏪 Revenu commerce +40%'],
    },
    {
      id: 'sante_publique',
      name: 'Santé Publique',
      icon: '🏥',
      desc: 'Hôpitaux triplent leur effet satisfaction. Épidémies réduites.',
      cost: 2500,
      requires: ['urbanisme'],
      effect() {
        BUILDINGS.hospital.happy   = Math.round(BUILDINGS.hospital.happy * 3);
        BUILDINGS.hospital.upkeep  = Math.round(BUILDINGS.hospital.upkeep * 0.8);
        window._techHealthBonus    = true;
      },
      effectDesc: ['🏥 Satisfaction hôpital ×3', '💊 Épidémies moins sévères', '💰 Entretien hôpital −20%'],
    },
    {
      id: 'securite',
      name: 'Sécurité Renforcée',
      icon: '🛡️',
      desc: 'Commissariats −40% coût, crime réduit de 20 points en permanence.',
      cost: 1800,
      requires: [],
      effect() {
        BUILDINGS.police.cost  = Math.round(BUILDINGS.police.cost  * 0.6);
        BUILDINGS.fire.cost    = Math.round(BUILDINGS.fire.cost    * 0.7);
        window._techCrimeBonus = (window._techCrimeBonus || 0) + 20;
      },
      effectDesc: ['🚔 Commissariat −40% coût', '🚒 Pompiers −30% coût', '🚨 Crime −20 pts permanent'],
    },
    {
      id: 'economie_avancee',
      name: 'Économie Avancée',
      icon: '📈',
      desc: 'Usines & marchés +50% revenus. Population génère +1$/habitant/cycle.',
      cost: 3000,
      requires: ['urbanisme'],
      effect() {
        BUILDINGS.factory.income = Math.round(BUILDINGS.factory.income * 1.5);
        BUILDINGS.market.income  = Math.round(BUILDINGS.market.income  * 1.5);
        BUILDINGS.airport.income = Math.round(BUILDINGS.airport.income * 1.3);
        window._techTaxBonus     = (window._techTaxBonus || 0) + 1;
      },
      effectDesc: ['🏭 Revenu usine +50%', '🏬 Revenu marché +50%', '👥 +1$/hab./cycle'],
    },
    {
      id: 'smart_city',
      name: 'Smart City',
      icon: '🤖',
      desc: 'Toutes les dépenses d\'entretien réduites de 25%. Débloque si 3 techs actives.',
      cost: 4000,
      requires: ['green_energy', 'urbanisme', 'securite'],
      effect() {
        Object.keys(BUILDINGS).forEach(k => {
          if (BUILDINGS[k].upkeep > 0)
            BUILDINGS[k].upkeep = Math.max(1, Math.round(BUILDINGS[k].upkeep * 0.75));
        });
        window._techSmartCity = true;
      },
      effectDesc: ['🔧 Entretien global −25%', '🌆 Bonus satisfaction +5', '⚡ Efficacité maximale'],
    },
  ];

  const techState = {
    unlocked: new Set(),
    // hook: after tech unlock apply passive bonus each tick
  };

  // ── VÉRIFIER PRÉREQUIS ──
  function canUnlock(tech) {
    return tech.requires.every(r => techState.unlocked.has(r));
  }

  function isUnlocked(tech) {
    return techState.unlocked.has(tech.id);
  }

  function unlockTech(techId) {
    const tech = TECHS.find(t => t.id === techId);
    if (!tech || isUnlocked(tech)) return;
    if (!canUnlock(tech)) {
      notify('🔒 Prérequis non satisfaits !', 'error'); return;
    }
    if (budget < tech.cost) {
      notify(`💰 Budget insuffisant ! (besoin de ${tech.cost.toLocaleString('fr-FR')}$)`, 'error'); return;
    }
    budget -= tech.cost;
    techState.unlocked.add(tech.id);
    tech.effect();
    notify(`🔬 Technologie débloquée : ${tech.icon} ${tech.name} !`, 'success');
    if (typeof addJournalEntry === 'function')
      addJournalEntry('🔬', `Tech débloquée : ${tech.name}`, 'success');
    renderTechTree();
    updateUI();
    recalcResources();
    updateUI();
  }

  // ══════════════════════════════════════════
  //  SUCCÈS
  // ══════════════════════════════════════════

  const ACHIEVEMENTS = [
    // Population
    { id: 'pop_100',   icon: '👥', name: 'Premier Village',   desc: '100 habitants',         check: () => population >= 100   },
    { id: 'pop_500',   icon: '🏘️', name: 'Bourg Animé',      desc: '500 habitants',         check: () => population >= 500   },
    { id: 'pop_2000',  icon: '🏙️', name: 'Vraie Ville',      desc: '2 000 habitants',       check: () => population >= 2000  },
    { id: 'pop_10000', icon: '🌆', name: 'Métropole',         desc: '10 000 habitants',      check: () => population >= 10000 },
    // Budget
    { id: 'rich_5k',   icon: '💵', name: 'Petite Caisse',    desc: '5 000$ en banque',      check: () => budget >= 5000      },
    { id: 'rich_50k',  icon: '💰', name: 'Trésor Municipal', desc: '50 000$ en banque',     check: () => budget >= 50000     },
    // Bâtiments
    { id: 'first_power',  icon: '⚡', name: 'Lumières Allumées', desc: 'Première centrale',  check: () => countBuildingType('power') >= 1    },
    { id: 'first_hosp',   icon: '🏥', name: 'Soins Gratuits',   desc: 'Premier hôpital',    check: () => countBuildingType('hospital') >= 1 },
    { id: 'green_city',   icon: '🌿', name: 'Ville Verte',       desc: '5 parcs construits', check: () => countBuildingType('park') >= 5     },
    { id: 'industrial',   icon: '🏭', name: 'Zone Industrielle', desc: '3 usines actives',   check: () => countBuildingType('factory') >= 3  },
    { id: 'airport_built',icon: '✈️', name: 'Hub International', desc: 'Aéroport construit', check: () => countBuildingType('airport') >= 1  },
    // Satisfaction
    { id: 'happy_80',  icon: '😁', name: 'Peuple Heureux',   desc: 'Satisfaction ≥ 80%',   check: () => satisfaction >= 80  },
    { id: 'happy_95',  icon: '🥳', name: 'Paradis Urbain',   desc: 'Satisfaction ≥ 95%',   check: () => satisfaction >= 95  },
    // Systèmes
    { id: 'no_crime',  icon: '🕊️', name: 'Ville Sûre',       desc: 'Crime ≤ 5%',
      check: () => typeof SystemsModule !== 'undefined' && SystemsModule.getState().crime <= 5 && countBuildingType('police') > 0 },
    { id: 'no_poll',   icon: '🌱', name: 'Air Pur',           desc: 'Pollution ≤ 5%',
      check: () => typeof SystemsModule !== 'undefined' && SystemsModule.getState().pollution <= 5 && countBuildingType('park') > 0 },
    // Tech
    { id: 'tech_first', icon: '🔬', name: 'Chercheur',        desc: 'Première technologie', check: () => techState.unlocked.size >= 1 },
    { id: 'tech_all',   icon: '🤖', name: 'Smart City',        desc: 'Toutes les techs',    check: () => techState.unlocked.size >= TECHS.length },
  ];

  const achievState = { unlocked: new Set() };

  function checkAchievements() {
    for (const a of ACHIEVEMENTS) {
      if (achievState.unlocked.has(a.id)) continue;
      try {
        if (a.check()) {
          achievState.unlocked.add(a.id);
          showAchievementToast(a);
          if (typeof addJournalEntry === 'function')
            addJournalEntry(a.icon, `Succès : ${a.name} — ${a.desc}`, 'success');
          renderAchievements();
        }
      } catch(e) {}
    }
  }

  function showAchievementToast(a) {
    const toast = document.createElement('div');
    toast.className = 'achiev-toast';
    toast.innerHTML = `
      <div class="at-icon">${a.icon}</div>
      <div class="at-body">
        <div class="at-title">Succès débloqué !</div>
        <div class="at-name">${a.name}</div>
        <div class="at-desc">${a.desc}</div>
      </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 500);
    }, 3500);
  }

  // ══════════════════════════════════════════
  //  UI — PANEL PROGRESSION
  // ══════════════════════════════════════════

  function buildPanel() {
    // Bouton dans la topbar
    const btn = document.createElement('button');
    btn.id = 'prog-btn';
    btn.className = 'prog-topbar-btn';
    btn.title = 'Progression & Technologies';
    btn.innerHTML = '🔬';
    btn.onclick = togglePanel;
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) topbarRight.prepend(btn);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'prog-panel';
    panel.className = 'prog-panel';
    panel.innerHTML = `
      <div class="prog-header">
        <div class="prog-tabs">
          <button class="prog-tab active" onclick="switchProgTab('tech',this)">🔬 Technologies</button>
          <button class="prog-tab" onclick="switchProgTab('achiev',this)">🏆 Succès</button>
        </div>
        <button class="prog-close" onclick="toggleProgPanel()">✕</button>
      </div>
      <div id="prog-tab-tech"   class="prog-tab-content active"></div>
      <div id="prog-tab-achiev" class="prog-tab-content"></div>
    `;
    document.body.appendChild(panel);

    renderTechTree();
    renderAchievements();
  }

  let panelOpen = false;
  function togglePanel() { panelOpen = !panelOpen; document.getElementById('prog-panel').classList.toggle('open', panelOpen); if (panelOpen) { renderTechTree(); renderAchievements(); } }
  window.toggleProgPanel = togglePanel;
  window.switchProgTab = function(tab, btnEl) {
    document.querySelectorAll('.prog-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.prog-tab-content').forEach(c => c.classList.remove('active'));
    btnEl.classList.add('active');
    document.getElementById(`prog-tab-${tab}`)?.classList.add('active');
    if (tab === 'tech') renderTechTree();
    else renderAchievements();
  };

  function renderTechTree() {
    const el = document.getElementById('prog-tab-tech');
    if (!el) return;

    el.innerHTML = `
      <div class="tech-budget-info">💰 Budget disponible : <strong>${budget.toLocaleString('fr-FR')} $</strong></div>
      <div class="tech-grid">
        ${TECHS.map(t => {
          const unlocked  = isUnlocked(t);
          const available = canUnlock(t) && !unlocked;
          const locked    = !canUnlock(t) && !unlocked;
          const affordable = budget >= t.cost;

          return `
          <div class="tech-card ${unlocked ? 'tech-done' : available ? 'tech-available' : 'tech-locked'}">
            <div class="tech-icon">${t.icon}</div>
            <div class="tech-body">
              <div class="tech-name">${t.name}</div>
              <div class="tech-desc">${t.desc}</div>
              ${t.requires.length ? `<div class="tech-req">Requiert : ${t.requires.map(r => TECHS.find(x=>x.id===r)?.name || r).join(', ')}</div>` : ''}
              <div class="tech-effects">
                ${t.effectDesc.map(e => `<span class="tech-eff">${e}</span>`).join('')}
              </div>
            </div>
            <div class="tech-action">
              ${unlocked
                ? `<div class="tech-badge-done">✅ Actif</div>`
                : locked
                  ? `<div class="tech-badge-locked">🔒 Verrouillé</div>`
                  : `<button class="tech-unlock-btn ${affordable ? '' : 'cant-afford'}"
                       onclick="ProgressionModule._unlock('${t.id}')"
                       ${affordable ? '' : 'disabled'}>
                       ${t.cost.toLocaleString('fr-FR')} $
                     </button>`
              }
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  function renderAchievements() {
    const el = document.getElementById('prog-tab-achiev');
    if (!el) return;

    const done  = ACHIEVEMENTS.filter(a => achievState.unlocked.has(a.id));
    const todo  = ACHIEVEMENTS.filter(a => !achievState.unlocked.has(a.id));

    el.innerHTML = `
      <div class="achiev-progress">
        <div class="ap-bar-track">
          <div class="ap-bar-fill" style="width:${Math.round(done.length/ACHIEVEMENTS.length*100)}%"></div>
        </div>
        <span class="ap-label">${done.length} / ${ACHIEVEMENTS.length} succès</span>
      </div>
      <div class="achiev-grid">
        ${done.map(a => `
          <div class="achiev-card done">
            <div class="achiev-icon">${a.icon}</div>
            <div class="achiev-name">${a.name}</div>
            <div class="achiev-desc">${a.desc}</div>
          </div>`).join('')}
        ${todo.map(a => `
          <div class="achiev-card todo">
            <div class="achiev-icon" style="filter:grayscale(1) opacity(.4)">${a.icon}</div>
            <div class="achiev-name" style="opacity:.5">${a.name}</div>
            <div class="achiev-desc" style="opacity:.35">${a.desc}</div>
          </div>`).join('')}
      </div>
    `;
  }

  // ══════════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════════

  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      /* ── Bouton topbar ── */
      .prog-topbar-btn {
        width:32px; height:32px; display:flex; align-items:center; justify-content:center;
        background:rgba(255,255,255,.04); border:1px solid rgba(56,92,148,.2);
        border-radius:8px; cursor:pointer; font-size:15px; transition:all .15s; color:#d8e3f0;
      }
      .prog-topbar-btn:hover { background:rgba(168,85,247,.1); border-color:rgba(168,85,247,.3); }

      /* ── Panel principal ── */
      .prog-panel {
        position:fixed; bottom:calc(var(--toolbar-h,76px) + 10px); right:10px;
        width:360px; max-height:520px; z-index:190;
        background:rgba(8,14,26,.98); backdrop-filter:blur(24px);
        border:1px solid rgba(56,92,148,.3); border-radius:14px;
        box-shadow:0 20px 60px rgba(0,0,0,.6);
        transform:translateY(20px) scale(.95); opacity:0; pointer-events:none;
        transition:all .3s cubic-bezier(.4,0,.2,1);
        display:flex; flex-direction:column; overflow:hidden;
      }
      .prog-panel.open { transform:translateY(0) scale(1); opacity:1; pointer-events:all; }

      /* ── Header ── */
      .prog-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:8px 12px; border-bottom:1px solid rgba(56,92,148,.2);
        background:rgba(10,18,32,.8); flex-shrink:0;
      }
      .prog-tabs { display:flex; gap:4px; }
      .prog-tab {
        padding:5px 12px; border-radius:8px; background:transparent;
        border:1px solid transparent; color:#6b7fa3; font-size:12px; font-weight:600;
        cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif;
      }
      .prog-tab.active { background:rgba(168,85,247,.1); border-color:rgba(168,85,247,.3); color:#a855f7; }
      .prog-tab:hover:not(.active) { background:rgba(255,255,255,.04); color:#d8e3f0; }
      .prog-close {
        background:none; border:none; color:#6b7fa3; cursor:pointer;
        font-size:13px; padding:2px 6px; border-radius:6px; transition:all .15s;
      }
      .prog-close:hover { background:rgba(255,85,85,.15); color:#ff5555; }

      /* ── Tab content ── */
      .prog-tab-content { display:none; flex:1; overflow-y:auto; padding:10px 12px;
        scrollbar-width:thin; scrollbar-color:rgba(168,85,247,.2) transparent; }
      .prog-tab-content.active { display:block; }

      /* ── Tech tree ── */
      .tech-budget-info {
        font-size:11px; color:#6b7fa3; margin-bottom:10px;
        padding:6px 10px; background:rgba(255,255,255,.02);
        border-radius:8px; border:1px solid rgba(56,92,148,.15);
      }
      .tech-budget-info strong { color:#fbbf24; font-family:'Exo 2',sans-serif; }

      .tech-grid { display:flex; flex-direction:column; gap:8px; }

      .tech-card {
        display:flex; align-items:flex-start; gap:10px;
        padding:10px 12px; border-radius:10px; border:1px solid;
        transition:all .2s;
      }
      .tech-card.tech-done      { background:rgba(34,214,122,.05); border-color:rgba(34,214,122,.2); }
      .tech-card.tech-available { background:rgba(168,85,247,.05); border-color:rgba(168,85,247,.25); }
      .tech-card.tech-available:hover { background:rgba(168,85,247,.1); border-color:rgba(168,85,247,.4); }
      .tech-card.tech-locked    { background:rgba(255,255,255,.01); border-color:rgba(56,92,148,.1); opacity:.6; }

      .tech-icon { font-size:22px; flex-shrink:0; line-height:1; margin-top:2px; }
      .tech-body { flex:1; min-width:0; }
      .tech-name { font-size:13px; font-weight:700; color:#d8e3f0; margin-bottom:2px; }
      .tech-desc { font-size:11px; color:#6b7fa3; line-height:1.4; margin-bottom:4px; }
      .tech-req  { font-size:10px; color:#a855f7; margin-bottom:4px; }
      .tech-effects { display:flex; flex-wrap:wrap; gap:3px; }
      .tech-eff  {
        font-size:9px; padding:2px 6px; border-radius:4px;
        background:rgba(255,255,255,.04); color:#6b7fa3;
        border:1px solid rgba(56,92,148,.15);
      }
      .tech-action { flex-shrink:0; display:flex; align-items:center; }
      .tech-badge-done   { font-size:12px; color:#22d67a; font-weight:700; }
      .tech-badge-locked { font-size:12px; color:#3a4a62; }
      .tech-unlock-btn {
        padding:6px 12px; border-radius:8px; font-size:11px; font-weight:700;
        background:rgba(168,85,247,.12); border:1px solid rgba(168,85,247,.4);
        color:#a855f7; cursor:pointer; transition:all .15s; white-space:nowrap;
        font-family:'Exo 2',sans-serif;
      }
      .tech-unlock-btn:hover:not(:disabled) { background:rgba(168,85,247,.25); }
      .tech-unlock-btn.cant-afford { opacity:.4; cursor:not-allowed; }

      /* ── Achievements ── */
      .achiev-progress {
        display:flex; align-items:center; gap:10px; margin-bottom:10px;
      }
      .ap-bar-track {
        flex:1; height:6px; background:rgba(255,255,255,.06);
        border-radius:3px; overflow:hidden;
      }
      .ap-bar-fill {
        height:100%; background:linear-gradient(90deg,#a855f7,#3b9eff);
        border-radius:3px; transition:width .4s;
      }
      .ap-label { font-size:11px; color:#6b7fa3; white-space:nowrap; font-family:'Exo 2',sans-serif; }

      .achiev-grid {
        display:grid; grid-template-columns:1fr 1fr; gap:6px;
      }
      .achiev-card {
        padding:8px 10px; border-radius:9px; border:1px solid;
        text-align:center; transition:all .2s;
      }
      .achiev-card.done {
        background:rgba(59,158,255,.06); border-color:rgba(59,158,255,.2);
      }
      .achiev-card.done:hover { background:rgba(59,158,255,.12); }
      .achiev-card.todo {
        background:rgba(255,255,255,.01); border-color:rgba(56,92,148,.1);
      }
      .achiev-icon { font-size:20px; margin-bottom:3px; }
      .achiev-name { font-size:10px; font-weight:700; color:#d8e3f0; line-height:1.2; }
      .achiev-desc { font-size:9px; color:#6b7fa3; margin-top:2px; }

      /* ── Toast succès ── */
      .achiev-toast {
        position:fixed; bottom:calc(var(--toolbar-h,76px) + 16px); left:50%;
        transform:translateX(-50%) translateY(20px);
        display:flex; align-items:center; gap:12px;
        padding:12px 20px; border-radius:14px; z-index:999;
        background:rgba(8,14,26,.98); backdrop-filter:blur(20px);
        border:1px solid rgba(59,158,255,.35);
        box-shadow:0 8px 40px rgba(0,0,0,.6), 0 0 20px rgba(59,158,255,.1);
        opacity:0; pointer-events:none;
        transition:all .4s cubic-bezier(.34,1.56,.64,1);
        min-width:260px; max-width:90vw;
      }
      .achiev-toast.visible { opacity:1; transform:translateX(-50%) translateY(0); }
      .at-icon { font-size:28px; flex-shrink:0; }
      .at-body { flex:1; }
      .at-title { font-size:9px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#3b9eff; font-family:'Exo 2',sans-serif; }
      .at-name  { font-size:14px; font-weight:800; color:#fff; margin:2px 0; }
      .at-desc  { font-size:11px; color:#6b7fa3; }

      @media (max-width:700px) {
        .prog-panel { right:0; bottom:calc(var(--toolbar-h,76px)+6px); width:100vw; border-radius:14px 14px 0 0; max-height:65vh; }
        .achiev-grid { grid-template-columns:1fr 1fr; }
      }
    `;
    document.head.appendChild(s);
  }

  // ══════════════════════════════════════════
  //  TICK EXTENSION
  // ══════════════════════════════════════════

  window._gameTickExtensions = window._gameTickExtensions || [];
  window._gameTickExtensions.push(function progressionTick() {
    if (!gameStarted) return;

    // Vérifier succès toutes les 30 ticks
    if (tick % 30 === 0) checkAchievements();

    // Bonus taxe de tech économie avancée
    if (tick % 60 === 0 && window._techTaxBonus) {
      budget += Math.floor(population * window._techTaxBonus);
    }

    // Bonus satisfaction Smart City via hook dans recalcResources
    window._satBonus = window._techSmartCity ? 5 : 0;

    // Refresh tech panel si ouvert
    if (panelOpen && tick % 60 === 0) renderTechTree();
  });

  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════

  function init() {
    injectStyles();
    buildPanel();
  }

  // API publique exposée sur window pour les onclick HTML
  const api = {
    init,
    _unlock: unlockTech,
    getTechState:   () => ({ ...techState }),
    getAchievState: () => ({ ...achievState }),
  };
  window.ProgressionModule = api;
  return api;

})();

// ── ATTENDRE QUE LE JEU SOIT PRÊT ──
const _waitProg = setInterval(() => {
  if (typeof gameStarted !== 'undefined' && typeof BUILDINGS !== 'undefined' &&
      typeof budget !== 'undefined' && typeof notify === 'function') {
    clearInterval(_waitProg);
    ProgressionModule.init();
  }
}, 100);