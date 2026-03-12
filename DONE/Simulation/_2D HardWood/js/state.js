// ═══════════════════════════════════════
//  state.js — Game state, init, save/load
// ═══════════════════════════════════════

let G = {};

// ── Helpers ──────────────────────────────────────────────────
function rnd(a, b)    { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v,a,b) { return Math.max(a, Math.min(b, v)); }

function overallRating(p) {
  return Math.round((p.shooting + p.defense + p.speed + p.strength + p.iq) / 5);
}

function randomName() {
  const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${fn} ${ln}`;
}

// ── Roster generation ─────────────────────────────────────────
function generateRoster(count, color) {
  const players = [];
  for (let i = 0; i < count; i++) {
    const pos  = POSITIONS[i % POSITIONS.length];
    const base = rnd(55, 75);
    players.push({
      id:       Math.random().toString(36).slice(2, 8),
      name:     randomName(),
      pos,
      num:      rnd(1, 99),
      shooting: clamp(base + rnd(-10, 15), 40, 95),
      defense:  clamp(base + rnd(-10, 15), 40, 95),
      speed:    clamp(base + rnd(-10, 15), 40, 95),
      strength: clamp(base + rnd(-10, 15), 40, 95),
      iq:       clamp(base + rnd(-10, 15), 40, 95),
      energy:   100,
      salary:   Math.round((base + rnd(-5, 10)) * 0.8),
      starter:  true,
      matchPts: 0, matchReb: 0, matchAst: 0,
      color,
    });
  }
  return players;
}

// ── Schedule builder ──────────────────────────────────────────
function buildSchedule(myName, aiTeams) {
  const schedule = [];
  const allNames = aiTeams.map(t => t.name);

  const shuffle = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // 5 Exhibition
  shuffle(allNames).slice(0, 5).forEach(opp =>
    schedule.push({ type:'exhibition', opp, played:false, win:null, myScore:0, oppScore:0 })
  );

  // 3 Cup games (semi x2 + final)
  shuffle(allNames).slice(0, 3).forEach((opp, i) =>
    schedule.push({ type:'cup', opp, played:false, win:null, myScore:0, oppScore:0, cupRound: i < 2 ? 'Semi-Final' : 'Final' })
  );

  // 10 League games
  shuffle([...allNames, ...allNames.slice(0, 2)]).slice(0, 10).forEach(opp =>
    schedule.push({ type:'league', opp, played:false, win:null, myScore:0, oppScore:0 })
  );

  return schedule;
}

// ── Initialize new game ───────────────────────────────────────
function initState(teamName, city, color, diff) {
  const myRoster = generateRoster(5, color);

  const aiTeams = AI_TEAMS.map(t => ({
    ...t,
    wins:   0,
    losses: 0,
    roster: generateRoster(5, t.color),
    tactic: TACTICS_LIST[Math.floor(Math.random() * TACTICS_LIST.length)].id,
  }));

  G = {
    version:       1,
    team:          { name:teamName, city, color, wins:0, losses:0, tactic:'triangle', formation:'2-1-2' },
    roster:        myRoster,
    budget:        1200,
    season:        1,
    trainingUsed:  0,
    maxTraining:   2,
    aiTeams,
    schedule:      buildSchedule(teamName, aiTeams),
    currentMatchIdx: 0,
    difficulty:    diff,
    leagueHistory: [],
    match:         null,
  };

  saveGame();
}

// ── Save / Load ───────────────────────────────────────────────
function saveGame() {
  try { localStorage.setItem('hardwood_save', JSON.stringify(G)); } catch(e) {}
  updateNavBadges();
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem('hardwood_save'));
    if (!saved || !saved.team) { notify('No save found. Start a new game!', 'error'); return; }
    G = saved;
    startApp();
    notify('Game loaded!', 'success');
  } catch(e) {
    notify('Failed to load save.', 'error');
  }
}

// ── Market pool (generated fresh each time) ───────────────────
let marketPool = [];

function generateMarket() {
  return Array.from({ length: 8 }, (_, i) => {
    const p   = generateRoster(1, '#888')[0];
    p.color   = JERSEY_COLORS[i % JERSEY_COLORS.length];
    return p;
  });
}

function refreshMarket() {
  marketPool = generateMarket();
  renderMarket();
  notify('Market refreshed!', 'info');
}

function signPlayer(idx) {
  const p    = marketPool[idx];
  if (!p) return;
  const cost = p.salary * 3;
  if (G.budget < cost) { notify('Not enough budget!', 'error'); return; }
  G.budget -= cost;
  p.color    = G.team.color;
  p.starter  = true;
  p.energy   = 80;
  G.roster.push(p);
  marketPool.splice(idx, 1);
  saveGame();
  renderMarket();
  notify(`${p.name} signed!`, 'success');
}

function releasePlayer(idx) {
  if (G.roster.length <= 5) { notify('Need at least 5 players!', 'error'); return; }
  const p     = G.roster[idx];
  G.budget   += Math.round(p.salary * 0.3);
  G.roster.splice(idx, 1);
  saveGame();
  renderMarket();
  notify(`${p.name} released. +${Math.round(p.salary * .3)}K`, 'info');
}