// ═══════════════════════════════════════
//  match.js — Match engine & court canvas
// ═══════════════════════════════════════

let matchState = null;

// ── Start match ───────────────────────────────────────────────
function startMatch(schedIdx) {
  const sched = G.schedule[schedIdx];
  if (!sched) return;

  const oppTeam  = G.aiTeams.find(t => t.name === sched.opp);
  const oppTactic = TACTICS_LIST.find(t => t.id === (oppTeam?.tactic || 'triangle')) || TACTICS_LIST[2];
  const myTactic  = TACTICS_LIST.find(t => t.id === G.team.tactic) || TACTICS_LIST[2];

  // Reset per-game stats
  G.roster.forEach(p => { p.matchPts = 0; p.matchReb = 0; p.matchAst = 0; });

  const oppRoster = oppTeam ? oppTeam.roster : generateRoster(5, '#888');
  const diffMult  = { easy: 0.80, normal: 1.0, hard: 1.18 }[G.difficulty] || 1;

  matchState = {
    schedIdx,
    sched,
    myTeam:       G.team,
    myRoster:     G.roster,
    oppTeam:      oppTeam || { name: sched.opp, color: '#888' },
    oppRoster,
    myScore:      0,
    oppScore:     0,
    quarter:      1,
    actionsLeft:  48,
    possession:   'my',
    log:          [],
    myTactic,
    oppTactic,
    diffMult,
    momentum:     50,
    finished:     false,
  };

  showMatchScreen();
  renderMatchHUD();
  nextPossession();
}

// ── Show / hide match screen ──────────────────────────────────
function showMatchScreen() {
  document.getElementById('matchScreen').style.display = 'flex';
  document.getElementById('msMyName').textContent      = G.team.name;
  document.getElementById('msOppName').textContent     = matchState.oppTeam.name;
  document.getElementById('matchLog').innerHTML        = '<div style="text-align:center;color:var(--muted);font-size:.8em;padding:20px">Game starting...</div>';
  drawCourt();
}

function hideMatchScreen() {
  document.getElementById('matchScreen').style.display = 'none';
}

// ── HUD update ────────────────────────────────────────────────
function renderMatchHUD() {
  if (!matchState) return;

  document.getElementById('msMyScore').textContent  = matchState.myScore;
  document.getElementById('msOppScore').textContent = matchState.oppScore;
  document.getElementById('msQuarter').textContent  = `Q${matchState.quarter} · ${matchState.actionsLeft} actions left`;
  document.getElementById('msTimer').textContent    = `${Math.ceil(matchState.actionsLeft / 4)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
  document.getElementById('momentumBar').style.width = matchState.momentum + '%';
  document.getElementById('possBar').style.width     = (matchState.possession === 'my' ? 65 : 35) + '%';

  const html = G.roster.slice(0, 5).map(p =>
    `<div class="on-court-player">
       <span class="on-court-name">${p.name.split(' ')[1]} <small style="color:var(--muted)">${p.pos}</small></span>
       <span class="on-court-pts">${p.matchPts}pts</span>
     </div>`
  ).join('');
  document.getElementById('onCourtPlayers').innerHTML = html;
}

// ── Possession flow ───────────────────────────────────────────
function nextPossession() {
  if (!matchState || matchState.finished) return;

  // Update quarter
  if      (matchState.actionsLeft > 36) matchState.quarter = 1;
  else if (matchState.actionsLeft > 24) matchState.quarter = 2;
  else if (matchState.actionsLeft > 12) matchState.quarter = 3;
  else                                   matchState.quarter = 4;

  if (matchState.actionsLeft <= 0) { endMatch(); return; }

  // Alternate possession, slight home advantage
  matchState.possession = matchState.actionsLeft % 2 === 0 ? 'my' : (Math.random() < 0.55 ? 'my' : 'opp');

  if (matchState.possession === 'opp') {
    setTimeout(() => { aiPossession(); nextPossession(); }, 320);
  } else {
    showActions();
  }

  renderMatchHUD();
}

// ── AI possession ─────────────────────────────────────────────
function aiPossession() {
  const ms        = matchState;
  const tact      = ms.oppTactic;
  const oAvg      = ms.oppRoster.reduce((s, p) => s + overallRating(p), 0) / ms.oppRoster.length;
  const baseSucc  = clamp((oAvg / 100) * ms.diffMult + (tact.offBonus || 0) / 100, 0.3, 0.72);
  const r         = Math.random();

  if (r < baseSucc * 0.55) {
    ms.oppScore += 2;
    addLog(`${ms.oppTeam.name}: 2-pointer! (${ms.oppScore})`, 'score-log');
    ms.momentum = clamp(ms.momentum - 8, 0, 100);
  } else if (r < baseSucc * 0.75) {
    ms.oppScore += 3;
    addLog(`${ms.oppTeam.name}: THREE POINTER! (${ms.oppScore})`, 'score-log');
    ms.momentum = clamp(ms.momentum - 12, 0, 100);
  } else if (r < baseSucc * 0.9) {
    addLog(`${ms.oppTeam.name}: shot missed, rebound...`, 'miss-log');
    ms.momentum = clamp(ms.momentum + 4, 0, 100);
  } else {
    addLog(`${ms.oppTeam.name}: turnover! Fast break opportunity.`, 'turnover-log');
    ms.momentum = clamp(ms.momentum + 10, 0, 100);
  }

  ms.actionsLeft--;
  renderMatchHUD();
  drawCourt();
}

// ── Player actions ────────────────────────────────────────────
function showActions() {
  const ms  = matchState;
  const my  = ms.myRoster;
  const avg = my.reduce((s, p) => s + overallRating(p), 0) / my.length;
  const tact = ms.myTactic;
  const mom  = ms.momentum;
  const momBonus = (mom - 50) * 0.003;

  const base3    = clamp(0.28 + (my[0].shooting - 60) / 100 + tact.offBonus / 100 + momBonus, 0.15, 0.60);
  const base2    = clamp(0.45 + (avg - 60)            / 100 + tact.offBonus / 100 + momBonus, 0.30, 0.72);
  const baseDrive= clamp(0.50 + (my[0].speed   - 60)  / 100 + momBonus,                       0.30, 0.68);
  const basePost = clamp(0.48 + (my[4].strength- 60)  / 100 + momBonus,                       0.28, 0.68);
  const basePass = clamp(0.65 + (my[2].iq      - 60)  / 100,                                   0.45, 0.85);
  const baseSteal= clamp(0.25 + (my[1].defense - 60)  / 100 - (ms.diffMult - 1) * 0.1,        0.10, 0.45);

  const pct = v => `${Math.round(v * 100)}%`;
  const cls = v => v > 0.55 ? 'good' : v < 0.35 ? 'bad' : '';

  const actions = [
    { label:'🏀 3-Point Shot',   key:'1', type:'3pt',   rate:base3,     chance:pct(base3),     cls:cls(base3)    },
    { label:'🎯 Mid-Range',      key:'2', type:'2pt',   rate:base2,     chance:pct(base2),     cls:cls(base2)    },
    { label:'⚡ Drive & Layup',  key:'3', type:'drive', rate:baseDrive, chance:pct(baseDrive), cls:cls(baseDrive)},
    { label:'💪 Post Up',        key:'4', type:'post',  rate:basePost,  chance:pct(basePost),  cls:cls(basePost) },
    { label:'👐 Dish & Assist',  key:'5', type:'pass',  rate:basePass,  chance:pct(basePass),  cls:cls(basePass) },
    { label:'🛡 Force Turnover', key:'6', type:'steal', rate:baseSteal, chance:pct(baseSteal), cls:cls(baseSteal)},
  ];

  document.getElementById('actionGrid').innerHTML = actions.map(a =>
    `<button class="action-btn" onclick="doAction('${a.type}',${a.rate})">
       ${a.label}<kbd class="hotkey">${a.key}</kbd>
       <span class="chance ${a.cls}">${a.chance}</span>
     </button>`
  ).join('');

  document.onkeydown = e => {
    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx < actions.length) doAction(actions[idx].type, actions[idx].rate);
  };
}

function doAction(type, successRate) {
  if (!matchState || matchState.finished) return;
  document.onkeydown = null;
  document.getElementById('actionGrid').innerHTML = '';

  const ms     = matchState;
  const my     = ms.myRoster;
  const ok     = Math.random() < successRate;
  const scorer = my[Math.floor(Math.random() * Math.min(3, my.length))];

  ms.actionsLeft--;

  switch (type) {
    case '3pt':
      if (ok) {
        ms.myScore += 3; scorer.matchPts += 3;
        addLog(`🔥 ${scorer.name} hits a THREE! +3 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 15, 0, 100);
        flashScore('my');
      } else {
        addLog(`${scorer.name} fires a 3 — off the mark.`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 5, 0, 100);
      }
      break;

    case '2pt':
      if (ok) {
        ms.myScore += 2; scorer.matchPts += 2;
        addLog(`✅ ${scorer.name} mid-range — GOOD! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 8, 0, 100);
        flashScore('my');
      } else {
        addLog(`${scorer.name} mid-ranger — no good.`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 3, 0, 100);
      }
      break;

    case 'drive':
      if (ok) {
        const pts = Math.random() < 0.3 ? 3 : 2;
        ms.myScore += pts; scorer.matchPts += pts;
        addLog(`⚡ ${scorer.name} drives hard — and-${pts === 3 ? 'one' : 'two'}! +${pts} (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 10, 0, 100);
        flashScore('my');
      } else {
        addLog(`${scorer.name} drives into contact — blocked!`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 4, 0, 100);
      }
      break;

    case 'post': {
      const big = my[4];
      if (ok) {
        ms.myScore += 2; big.matchPts += 2;
        addLog(`💪 ${big.name} posts up — bucket! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 7, 0, 100);
        flashScore('my');
      } else {
        addLog(`Post move — swatted away! Transition defense.`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 6, 0, 100);
      }
      break;
    }

    case 'pass': {
      const passer   = my[Math.floor(Math.random() * 2)];
      const receiver = my[2 + Math.floor(Math.random() * 2)];
      if (ok) {
        ms.myScore += 2; receiver.matchPts += 2; passer.matchAst++;
        addLog(`👐 ${passer.name} → ${receiver.name} — ASSIST & SCORE! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 9, 0, 100);
        flashScore('my');
      } else {
        addLog(`Pass intercepted! Turnover.`, 'turnover-log');
        ms.oppScore += 2;
        addLog(`${ms.oppTeam.name} scores on the break. +2 (${ms.oppScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum - 12, 0, 100);
      }
      break;
    }

    case 'steal':
      if (ok) {
        ms.myScore += 2; my[1].matchPts += 2;
        addLog(`🛡 ${my[1].name} strips the ball — STEAL! Fast break! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 18, 0, 100);
        flashScore('my');
      } else {
        addLog(`Steal attempt — failed. Foul called.`, 'foul-log');
        const ft = Math.random() < 0.65 ? 2 : Math.random() < 0.5 ? 1 : 0;
        if (ft > 0) {
          ms.oppScore += ft;
          addLog(`${ms.oppTeam.name} sinks ${ft}/${ft > 1 ? 2 : 1} free throw${ft > 1 ? 's' : ''}. +${ft} (${ms.oppScore})`, 'score-log');
        }
        ms.momentum = clamp(ms.momentum - 10, 0, 100);
      }
      break;
  }

  renderMatchHUD();
  drawCourt();
  setTimeout(() => nextPossession(), 220);
}

// ── Score flash ───────────────────────────────────────────────
function flashScore(side) {
  const el = document.getElementById(side === 'my' ? 'msMyScore' : 'msOppScore');
  if (!el) return;
  el.style.textShadow = '0 0 30px currentColor';
  setTimeout(() => { el.style.textShadow = 'none'; }, 400);
}

// ── Log ───────────────────────────────────────────────────────
function addLog(text, cls = '') {
  if (!matchState) return;
  matchState.log.push({ text, cls });
  const logEl = document.getElementById('matchLog');
  if (!logEl) return;
  const div = document.createElement('div');
  div.className   = `log-entry ${cls}`;
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

// ── End match ─────────────────────────────────────────────────
function endMatch() {
  if (!matchState) return;
  matchState.finished = true;
  document.onkeydown  = null;
  document.getElementById('actionGrid').innerHTML = '';

  const ms  = matchState;
  const win = ms.myScore > ms.oppScore;

  const sched    = G.schedule[ms.schedIdx];
  sched.played   = true;
  sched.win      = win;
  sched.myScore  = ms.myScore;
  sched.oppScore = ms.oppScore;

  if (sched.type === 'league') {
    if (win) G.team.wins++; else G.team.losses++;
    const oppAI = G.aiTeams.find(t => t.name === sched.opp);
    if (oppAI) { if (win) oppAI.losses++; else oppAI.wins++; }
  }

  const reward = win
    ? (sched.type === 'cup' ? 120 : sched.type === 'league' ? 80 : 40)
    : 20;
  G.budget += reward;

  G.roster.forEach(p => { p.energy = clamp(p.energy - rnd(15, 25), 20, 100); });
  G.trainingUsed = 0;

  const mvp = [...G.roster].sort((a, b) => b.matchPts - a.matchPts)[0];
  saveGame();
  showResult(win, ms.myScore, ms.oppScore, mvp, sched.type, reward);
}

// ── Result overlay ────────────────────────────────────────────
function showResult(win, myScore, oppScore, mvp, type, reward) {
  const overlay = document.getElementById('resultOverlay');
  overlay.classList.remove('hidden');

  const titleMap = { classic:'BUZZER BEATER !', exhibition:'MATCH OVER', cup:'CUP MATCH', league:'LEAGUE MATCH' };
  document.getElementById('resultTitle').textContent = win ? '🏆 VICTORY' : '💔 DEFEAT';
  document.getElementById('resultTitle').style.color = win ? 'var(--green)' : 'var(--accent2)';
  document.getElementById('resultScore').textContent  = `${myScore} — ${oppScore}`;
  document.getElementById('resultMvp').innerHTML = mvp
    ? `MVP: <span>${mvp.name}</span> · ${mvp.matchPts}pts${mvp.matchAst > 0 ? ' ' + mvp.matchAst + 'ast' : ''} · +${reward}K budget`
    : `+${reward}K budget`;

  document.getElementById('resultBtns').innerHTML =
    `<button class="btn btn-outline btn-sm" onclick="closeResult()">← Back to Hub</button>`;
}

function closeResult() {
  document.getElementById('resultOverlay').classList.add('hidden');
  hideMatchScreen();
  G.currentMatchIdx++;
  showTab('dashboard');
}

// ── Court canvas ──────────────────────────────────────────────
function drawCourt() {
  const canvas = document.getElementById('courtCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;

  // Background
  ctx.fillStyle = '#1a0a04';
  ctx.fillRect(0, 0, W, H);

  // Floor
  const floorGrad = ctx.createLinearGradient(0, H * 0.35, 0, H);
  floorGrad.addColorStop(0, '#5c2a08');
  floorGrad.addColorStop(1, '#3d1a04');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, H * 0.35, W, H * 0.65);

  // Wood planks
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1.5;
  for (let x = 0; x < W; x += 35) {
    ctx.beginPath(); ctx.moveTo(x, H * 0.35); ctx.lineTo(x, H); ctx.stroke();
  }

  // Court markings
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W / 2, H * 0.65, 60, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H * 0.65, 8,  0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(80,    H * 0.65, 120, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(W-80,  H * 0.65, 120, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
  ctx.strokeRect(20,    H * 0.40, 100, 80);
  ctx.strokeRect(W-120, H * 0.40, 100, 80);
  ctx.beginPath(); ctx.moveTo(W / 2, H * 0.35); ctx.lineTo(W / 2, H); ctx.stroke();

  // Hoops
  drawHoop(ctx, 60,    H * 0.52, G.team.color);
  drawHoop(ctx, W-60,  H * 0.52, matchState?.oppTeam?.color || '#888');

  // Players
  if (matchState) {
    const myPos  = [[180,H*.70],[150,H*.55],[200,H*.48],[230,H*.62],[200,H*.74]];
    const oppPos = [[W-180,H*.70],[W-150,H*.55],[W-200,H*.48],[W-230,H*.62],[W-200,H*.74]];
    matchState.myRoster.slice(0,5).forEach((p,i) => drawPlayer(ctx, myPos[i][0],  myPos[i][1],  G.team.color,                      p.pos, p.matchPts));
    matchState.oppRoster.slice(0,5).forEach((p,i)=> drawPlayer(ctx, oppPos[i][0], oppPos[i][1], matchState.oppTeam.color || '#888', p.pos, p.matchPts));

    // Ball
    const bx = matchState.possession === 'my' ? 250 : W - 250;
    const by = H * 0.58;
    ctx.fillStyle = '#e05c00';
    ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx - 10, by); ctx.lineTo(bx + 10, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by - 10); ctx.lineTo(bx, by + 10); ctx.stroke();
  }
}

function drawHoop(ctx, x, y, color) {
  const isLeft = x < 300;
  const bbX    = isLeft ? x - 20 : x + 8;

  ctx.fillStyle   = 'rgba(180,200,255,.15)';
  ctx.fillRect(bbX, y - 24, 12, 48);
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
  ctx.strokeRect(bbX, y - 24, 12, 48);

  ctx.strokeStyle = color || '#e05c00'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(isLeft ? x + 4 : x - 4, y, 14, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1;
  for (let i = -14; i <= 14; i += 7) {
    ctx.beginPath();
    ctx.moveTo((isLeft ? x + 4 : x - 4) + i, y + 14);
    ctx.lineTo((isLeft ? x + 4 : x - 4),     y + 32);
    ctx.stroke();
  }
}

function drawPlayer(ctx, x, y, color, pos, pts) {
  ctx.fillStyle = color || '#3d7fff';
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Barlow Condensed,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pos, x, y + 3);
  if (pts > 0) {
    ctx.fillStyle = 'rgba(255,215,0,.9)';
    ctx.font = '7px Barlow Condensed,sans-serif';
    ctx.fillText(pts + 'pts', x, y - 16);
  }
}