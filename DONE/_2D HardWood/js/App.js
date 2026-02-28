// ═══════════════════════════════════════
//  app.js — Entry point, navigation, UI
// ═══════════════════════════════════════

// ── Navigation ────────────────────────────────────────────────
const TAB_NAMES    = ['dashboard','roster','tactics','training','market','schedule','league'];
const TAB_RENDERS  = { dashboard:renderDashboard, roster:renderRoster, tactics:renderTactics, training:renderTraining, market:renderMarket, schedule:renderSchedule, league:renderLeague };

function showTab(tab) {
  document.querySelectorAll('.nav-tab').forEach((btn, i) => {
    btn.classList.toggle('active', TAB_NAMES[i] === tab);
  });
  if (TAB_RENDERS[tab]) TAB_RENDERS[tab]();
  updateNavBadges();
}

// ── Screen transitions ─────────────────────────────────────────
function showTitle() {
  document.getElementById('titleScreen').style.display  = 'flex';
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('app').style.display          = 'none';
}

function showSetup() {
  document.getElementById('titleScreen').style.display = 'none';
  document.getElementById('setupScreen').classList.remove('hidden');
}

function startApp() {
  document.getElementById('titleScreen').style.display = 'none';
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('app').style.display         = 'flex';
  showTab('dashboard');
}

// ── Team creation ─────────────────────────────────────────────
function createTeam() {
  const name  = document.getElementById('teamNameInput').value.trim() || 'The Blazers';
  const city  = document.getElementById('teamCityInput').value.trim() || 'New Horizon';
  const colorEl = document.querySelector('.jersey-swatch.active');
  const color = colorEl ? colorEl.dataset.color : '#3d7fff';
  const diff  = document.getElementById('diffSelect').value;
  initState(name, city, color, diff);
  startApp();
}

// ── Notifications ─────────────────────────────────────────────
let notifTimer = null;

function notify(msg, type = 'info') {
  const existing = document.querySelector('.notif');
  if (existing) existing.remove();

  const el       = document.createElement('div');
  el.className   = `notif ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);

  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.remove(), 2800);
}

// ── Init ───────────────────────────────────────────────────────
(function init() {
  // Jersey color swatches
  const pick = document.getElementById('jerseyPick');
  JERSEY_COLORS.forEach((c, i) => {
    const el           = document.createElement('div');
    el.className       = 'jersey-swatch' + (i === 0 ? ' active' : '');
    el.style.background = c;
    el.dataset.color   = c;
    el.onclick = () => {
      document.querySelectorAll('.jersey-swatch').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
    };
    pick.appendChild(el);
  });

  // Dim "continue" button if no save exists
  try {
    const saved = JSON.parse(localStorage.getItem('hardwood_save'));
    if (!saved) {
      const continueBtn = document.querySelector('#titleScreen .btn-outline');
      if (continueBtn) continueBtn.style.opacity = '.4';
    }
  } catch(e) {}
})();