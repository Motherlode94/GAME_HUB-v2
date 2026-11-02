// match.js - Match engine and animated court

let matchState = null;
let matchAnimationFrame = 0;

const MATCH_ACTION_DELAY = 680;
const MATCH_FORMATIONS = {
  '2-1-2': [[0.28, 0.60], [0.22, 0.42], [0.34, 0.42], [0.26, 0.74], [0.36, 0.68]],
  '1-3-1': [[0.33, 0.48], [0.24, 0.40], [0.29, 0.58], [0.24, 0.74], [0.39, 0.66]],
  '2-3':   [[0.28, 0.52], [0.34, 0.52], [0.22, 0.38], [0.25, 0.72], [0.37, 0.70]],
  '3-2':   [[0.24, 0.46], [0.31, 0.42], [0.37, 0.48], [0.27, 0.72], [0.36, 0.72]],
  '1-2-2': [[0.32, 0.46], [0.24, 0.56], [0.37, 0.56], [0.24, 0.76], [0.37, 0.74]]
};

function startMatch(schedIdx) {
  const sched = G.schedule[schedIdx];
  if (!sched) return;

  const oppTeam = G.aiTeams.find((team) => team.name === sched.opp);
  const oppTactic = TACTICS_LIST.find((t) => t.id === (oppTeam?.tactic || 'triangle')) || TACTICS_LIST[2];
  const myTactic = TACTICS_LIST.find((t) => t.id === G.team.tactic) || TACTICS_LIST[2];

  G.roster.forEach((player) => {
    player.matchPts = 0;
    player.matchReb = 0;
    player.matchAst = 0;
  });

  const oppRoster = oppTeam ? oppTeam.roster : generateRoster(5, '#888');
  const diffMult = { easy: 0.80, normal: 1.0, hard: 1.18 }[G.difficulty] || 1;

  matchState = {
    schedIdx,
    sched,
    myTeam: G.team,
    myRoster: G.roster,
    oppTeam: oppTeam || { name: sched.opp, color: '#888', formation: '2-1-2' },
    oppRoster,
    myScore: 0,
    oppScore: 0,
    quarter: 1,
    actionsLeft: 48,
    possession: 'my',
    log: [],
    myTactic,
    oppTactic,
    diffMult,
    momentum: 50,
    finished: false,
    visual: null
  };

  showMatchScreen();
  renderMatchHUD();
  nextPossession();
}

function showMatchScreen() {
  document.getElementById('matchScreen').style.display = 'flex';
  document.getElementById('msMyName').textContent = G.team.name;
  document.getElementById('msOppName').textContent = matchState.oppTeam.name;
  document.getElementById('matchLog').innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.8em;padding:20px">Game starting...</div>';
  ensureMatchVisualState();
  startMatchLoop();
  drawCourt();
}

function hideMatchScreen() {
  document.getElementById('matchScreen').style.display = 'none';
  stopMatchLoop();
}

function renderMatchHUD() {
  if (!matchState) return;

  document.getElementById('msMyScore').textContent = matchState.myScore;
  document.getElementById('msOppScore').textContent = matchState.oppScore;
  document.getElementById('msQuarter').textContent = `Q${matchState.quarter} · ${matchState.actionsLeft} actions left`;

  const elapsedThisQuarter = (48 - matchState.actionsLeft) % 12;
  const secondsLeft = Math.max(0, 720 - elapsedThisQuarter * 60);
  document.getElementById('msTimer').textContent = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  document.getElementById('momentumBar').style.width = matchState.momentum + '%';
  document.getElementById('possBar').style.width = (matchState.possession === 'my' ? 65 : 35) + '%';

  const html = G.roster.slice(0, 5).map((player) => `
    <div class="on-court-player">
      <span class="on-court-name">${player.name.split(' ')[1]} <small style="color:var(--muted)">${player.pos}</small></span>
      <span class="on-court-pts">${player.matchPts}pts</span>
    </div>
  `).join('');
  document.getElementById('onCourtPlayers').innerHTML = html;
}

function nextPossession() {
  if (!matchState || matchState.finished) return;

  if (matchState.actionsLeft > 36) matchState.quarter = 1;
  else if (matchState.actionsLeft > 24) matchState.quarter = 2;
  else if (matchState.actionsLeft > 12) matchState.quarter = 3;
  else matchState.quarter = 4;

  if (matchState.actionsLeft <= 0) {
    endMatch();
    return;
  }

  matchState.possession = matchState.actionsLeft % 2 === 0 ? 'my' : (Math.random() < 0.55 ? 'my' : 'opp');
  ensureMatchVisualState();
  setVisualTargets(matchState.possession === 'my' ? 'my' : 'opp', 'set');

  if (matchState.possession === 'opp') {
    document.getElementById('actionGrid').innerHTML = '';
    document.onkeydown = null;
    setTimeout(() => { aiPossession(); }, 280);
  } else {
    showActions();
  }

  renderMatchHUD();
}

function aiPossession() {
  if (!matchState || matchState.finished) return;

  const ms = matchState;
  const tact = ms.oppTactic;
  const oAvg = ms.oppRoster.reduce((sum, player) => sum + overallRating(player), 0) / ms.oppRoster.length;
  const baseSucc = clamp((oAvg / 100) * ms.diffMult + (tact.offBonus || 0) / 100, 0.3, 0.72);
  const roll = Math.random();
  const handlerIndex = Math.floor(Math.random() * Math.min(3, ms.oppRoster.length));
  let visualType = '2pt';
  let visualSuccess = false;

  if (roll < baseSucc * 0.55) {
    visualType = '2pt';
    visualSuccess = true;
    ms.oppScore += 2;
    addLog(`${ms.oppTeam.name}: 2-pointer! (${ms.oppScore})`, 'score-log');
    ms.momentum = clamp(ms.momentum - 8, 0, 100);
  } else if (roll < baseSucc * 0.75) {
    visualType = '3pt';
    visualSuccess = true;
    ms.oppScore += 3;
    addLog(`${ms.oppTeam.name}: THREE POINTER! (${ms.oppScore})`, 'score-log');
    ms.momentum = clamp(ms.momentum - 12, 0, 100);
  } else if (roll < baseSucc * 0.9) {
    visualType = 'drive';
    addLog(`${ms.oppTeam.name}: shot missed, rebound...`, 'miss-log');
    ms.momentum = clamp(ms.momentum + 4, 0, 100);
  } else {
    visualType = 'pass';
    addLog(`${ms.oppTeam.name}: turnover! Fast break opportunity.`, 'turnover-log');
    ms.momentum = clamp(ms.momentum + 10, 0, 100);
  }

  playVisualEvent('opp', visualType, {
    success: visualSuccess,
    handlerIndex,
    passerIndex: handlerIndex,
    receiverIndex: (handlerIndex + 2) % 5
  });

  ms.actionsLeft--;
  renderMatchHUD();
  setTimeout(() => nextPossession(), MATCH_ACTION_DELAY);
}

function showActions() {
  const ms = matchState;
  const my = ms.myRoster;
  const avg = my.reduce((sum, player) => sum + overallRating(player), 0) / my.length;
  const tact = ms.myTactic;
  const momBonus = (ms.momentum - 50) * 0.003;

  const base3 = clamp(0.28 + (my[0].shooting - 60) / 100 + tact.offBonus / 100 + momBonus, 0.15, 0.60);
  const base2 = clamp(0.45 + (avg - 60) / 100 + tact.offBonus / 100 + momBonus, 0.30, 0.72);
  const baseDrive = clamp(0.50 + (my[0].speed - 60) / 100 + momBonus, 0.30, 0.68);
  const basePost = clamp(0.48 + (my[4].strength - 60) / 100 + momBonus, 0.28, 0.68);
  const basePass = clamp(0.65 + (my[2].iq - 60) / 100, 0.45, 0.85);
  const baseSteal = clamp(0.25 + (my[1].defense - 60) / 100 - (ms.diffMult - 1) * 0.1, 0.10, 0.45);

  const actions = [
    { label: '🏀 3-Point Shot', key: '1', type: '3pt', rate: base3 },
    { label: '🎯 Mid-Range', key: '2', type: '2pt', rate: base2 },
    { label: '⚡ Drive & Layup', key: '3', type: 'drive', rate: baseDrive },
    { label: '💪 Post Up', key: '4', type: 'post', rate: basePost },
    { label: '👐 Dish & Assist', key: '5', type: 'pass', rate: basePass },
    { label: '🛡 Force Turnover', key: '6', type: 'steal', rate: baseSteal }
  ];

  document.getElementById('actionGrid').innerHTML = actions.map((action) => {
    const pct = `${Math.round(action.rate * 100)}%`;
    const cls = action.rate > 0.55 ? 'good' : action.rate < 0.35 ? 'bad' : '';
    return `
      <button class="action-btn" onclick="doAction('${action.type}', ${action.rate})">
        ${action.label}<kbd class="hotkey">${action.key}</kbd>
        <span class="chance ${cls}">${pct}</span>
      </button>
    `;
  }).join('');

  document.onkeydown = (event) => {
    const idx = Number.parseInt(event.key, 10) - 1;
    if (idx >= 0 && idx < actions.length) {
      doAction(actions[idx].type, actions[idx].rate);
    }
  };
}

function doAction(type, successRate) {
  if (!matchState || matchState.finished) return;

  document.onkeydown = null;
  document.getElementById('actionGrid').innerHTML = '';

  const ms = matchState;
  const my = ms.myRoster;
  const success = Math.random() < successRate;
  const scorer = my[Math.floor(Math.random() * Math.min(3, my.length))];
  const scorerIdx = Math.max(0, my.indexOf(scorer));
  const passerIdx = Math.floor(Math.random() * Math.min(2, my.length));
  const receiverIdx = Math.min(my.length - 1, 2 + Math.floor(Math.random() * Math.max(1, my.length - 2)));

  ms.actionsLeft--;

  switch (type) {
    case '3pt':
      playVisualEvent('my', '3pt', { success, handlerIndex: scorerIdx });
      if (success) {
        ms.myScore += 3;
        scorer.matchPts += 3;
        addLog(`🔥 ${scorer.name} hits a THREE! +3 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 15, 0, 100);
        flashScore('my');
      } else {
        addLog(`${scorer.name} fires a 3 - off the mark.`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 5, 0, 100);
      }
      break;

    case '2pt':
      playVisualEvent('my', '2pt', { success, handlerIndex: scorerIdx });
      if (success) {
        ms.myScore += 2;
        scorer.matchPts += 2;
        addLog(`✅ ${scorer.name} mid-range - GOOD! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 8, 0, 100);
        flashScore('my');
      } else {
        addLog(`${scorer.name} mid-ranger - no good.`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 3, 0, 100);
      }
      break;

    case 'drive':
      playVisualEvent('my', 'drive', { success, handlerIndex: scorerIdx });
      if (success) {
        const pts = Math.random() < 0.3 ? 3 : 2;
        ms.myScore += pts;
        scorer.matchPts += pts;
        addLog(`⚡ ${scorer.name} drives hard - and-${pts === 3 ? 'one' : 'two'}! +${pts} (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 10, 0, 100);
        flashScore('my');
      } else {
        addLog(`${scorer.name} drives into contact - blocked!`, 'miss-log');
        ms.momentum = clamp(ms.momentum - 4, 0, 100);
      }
      break;

    case 'post': {
      const big = my[4];
      playVisualEvent('my', 'post', { success, handlerIndex: 4 });
      if (success) {
        ms.myScore += 2;
        big.matchPts += 2;
        addLog(`💪 ${big.name} posts up - bucket! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 7, 0, 100);
        flashScore('my');
      } else {
        addLog('Post move - swatted away! Transition defense.', 'miss-log');
        ms.momentum = clamp(ms.momentum - 6, 0, 100);
      }
      break;
    }

    case 'pass': {
      const passer = my[passerIdx];
      const receiver = my[receiverIdx];
      playVisualEvent('my', 'pass', { success, passerIndex: passerIdx, receiverIndex: receiverIdx });
      if (success) {
        ms.myScore += 2;
        receiver.matchPts += 2;
        passer.matchAst++;
        addLog(`👐 ${passer.name} -> ${receiver.name} - ASSIST & SCORE! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 9, 0, 100);
        flashScore('my');
      } else {
        addLog('Pass intercepted! Turnover.', 'turnover-log');
        ms.oppScore += 2;
        addLog(`${ms.oppTeam.name} scores on the break. +2 (${ms.oppScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum - 12, 0, 100);
      }
      break;
    }

    case 'steal':
      playVisualEvent('my', 'steal', { success, handlerIndex: 1 });
      if (success) {
        ms.myScore += 2;
        my[1].matchPts += 2;
        addLog(`🛡 ${my[1].name} strips the ball - STEAL! Fast break! +2 (${ms.myScore})`, 'score-log');
        ms.momentum = clamp(ms.momentum + 18, 0, 100);
        flashScore('my');
      } else {
        addLog('Steal attempt - failed. Foul called.', 'foul-log');
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
  setTimeout(() => nextPossession(), MATCH_ACTION_DELAY);
}

function flashScore(side) {
  const el = document.getElementById(side === 'my' ? 'msMyScore' : 'msOppScore');
  if (!el) return;
  el.style.textShadow = '0 0 30px currentColor';
  setTimeout(() => { el.style.textShadow = 'none'; }, 400);
}

function addLog(text, cls = '') {
  if (!matchState) return;
  matchState.log.push({ text, cls });
  const logEl = document.getElementById('matchLog');
  if (!logEl) return;
  const div = document.createElement('div');
  div.className = `log-entry ${cls}`;
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function endMatch() {
  if (!matchState) return;

  matchState.finished = true;
  document.onkeydown = null;
  document.getElementById('actionGrid').innerHTML = '';

  const ms = matchState;
  const win = ms.myScore > ms.oppScore;
  const sched = G.schedule[ms.schedIdx];

  sched.played = true;
  sched.win = win;
  sched.myScore = ms.myScore;
  sched.oppScore = ms.oppScore;

  if (sched.type === 'league') {
    if (win) G.team.wins++;
    else G.team.losses++;
    const oppAI = G.aiTeams.find((team) => team.name === sched.opp);
    if (oppAI) {
      if (win) oppAI.losses++;
      else oppAI.wins++;
    }
  }

  const reward = win
    ? (sched.type === 'cup' ? 120 : sched.type === 'league' ? 80 : 40)
    : 20;
  G.budget += reward;

  G.roster.forEach((player) => {
    player.energy = clamp(player.energy - rnd(15, 25), 20, 100);
  });
  G.trainingUsed = 0;

  const mvp = [...G.roster].sort((a, b) => b.matchPts - a.matchPts)[0];
  saveGame();
  showResult(win, ms.myScore, ms.oppScore, mvp, sched.type, reward);
}

function showResult(win, myScore, oppScore, mvp, type, reward) {
  const overlay = document.getElementById('resultOverlay');
  overlay.classList.remove('hidden');

  document.getElementById('resultTitle').textContent = win ? '🏆 VICTORY' : '💔 DEFEAT';
  document.getElementById('resultTitle').style.color = win ? 'var(--green)' : 'var(--accent2)';
  document.getElementById('resultScore').textContent = `${myScore} — ${oppScore}`;
  document.getElementById('resultMvp').innerHTML = mvp
    ? `MVP: <span>${mvp.name}</span> · ${mvp.matchPts}pts${mvp.matchAst > 0 ? ' ' + mvp.matchAst + 'ast' : ''} · +${reward}K budget`
    : `+${reward}K budget`;

  document.getElementById('resultBtns').innerHTML =
    '<button class="btn btn-outline btn-sm" onclick="closeResult()">← Back to Hub</button>';
}

function closeResult() {
  document.getElementById('resultOverlay').classList.add('hidden');
  hideMatchScreen();
  G.currentMatchIdx++;
  showTab('dashboard');
}

function createVisualPlayers(roster) {
  return roster.slice(0, 5).map((player, index) => ({
    index,
    pos: player.pos,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    bob: Math.random() * Math.PI * 2,
    speed: 0.085 + Math.random() * 0.035
  }));
}

function ensureMatchVisualState() {
  if (!matchState) return null;
  if (matchState.visual) return matchState.visual;

  matchState.visual = {
    lastTs: 0,
    offense: 'my',
    actionType: 'set',
    myPlayers: createVisualPlayers(matchState.myRoster),
    oppPlayers: createVisualPlayers(matchState.oppRoster),
    ball: {
      mode: 'hold',
      ownerTeam: 'my',
      ownerIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      startTs: 0,
      duration: 1,
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
      arc: 0,
      endMode: 'hold',
      endTeam: 'my',
      endIndex: 0
    },
    pulse: 0
  };

  setVisualTargets('my', 'set');
  return matchState.visual;
}

function startMatchLoop() {
  stopMatchLoop();
  const step = (ts) => {
    if (!matchState || document.getElementById('matchScreen').style.display !== 'flex') {
      stopMatchLoop();
      return;
    }
    updateVisualAnimation(ts);
    drawCourt();
    matchAnimationFrame = requestAnimationFrame(step);
  };
  matchAnimationFrame = requestAnimationFrame(step);
}

function stopMatchLoop() {
  if (matchAnimationFrame) {
    cancelAnimationFrame(matchAnimationFrame);
    matchAnimationFrame = 0;
  }
}

function getCourtMetrics(W, H) {
  const padX = 28;
  const padY = 22;
  const left = padX;
  const right = W - padX;
  const top = padY;
  const bottom = H - padY;
  const width = right - left;
  const height = bottom - top;
  const midX = left + width / 2;
  const midY = top + height / 2;
  const keyW = width * 0.135;
  const keyH = height * 0.34;
  const rimOffset = width * 0.052;

  return {
    left, right, top, bottom, width, height, midX, midY,
    keyW, keyH,
    keyTop: midY - keyH / 2,
    keyBottom: midY + keyH / 2,
    rimLeftX: left + rimOffset,
    rimRightX: right - rimOffset,
    rimY: midY,
    centerR: height * 0.135,
    arcR: height * 0.315,
    restrictedR: height * 0.07
  };
}

function getFormationAnchors(side, formation, metrics) {
  const layout = MATCH_FORMATIONS[formation] || MATCH_FORMATIONS['2-1-2'];
  return layout.map(([nx, ny]) => ({
    x: side === 'my'
      ? metrics.left + metrics.width * nx
      : metrics.right - metrics.width * nx,
    y: metrics.top + metrics.height * ny
  }));
}

function getVisualTeam(side) {
  if (!matchState?.visual) return [];
  return side === 'my' ? matchState.visual.myPlayers : matchState.visual.oppPlayers;
}

function getVisualPlayer(side, index) {
  return getVisualTeam(side)[Math.max(0, Math.min(4, index || 0))] || null;
}

function setVisualTargets(offenseTeam, actionType, payload = {}) {
  if (!matchState) return;

  const visual = ensureMatchVisualState();
  const canvas = document.getElementById('courtCanvas');
  const metrics = getCourtMetrics(canvas?.width || 900, canvas?.height || 540);

  const myAnchors = getFormationAnchors('my', matchState.myTeam.formation || '2-1-2', metrics);
  const oppAnchors = getFormationAnchors('opp', matchState.oppTeam.formation || '2-1-2', metrics);
  const offenseAnchors = offenseTeam === 'my' ? myAnchors : oppAnchors;
  const defenseAnchors = offenseTeam === 'my' ? oppAnchors : myAnchors;
  const attackDir = offenseTeam === 'my' ? -1 : 1;
  const handlerIndex = payload.handlerIndex ?? payload.passerIndex ?? 0;
  const receiverIndex = payload.receiverIndex ?? Math.min(4, handlerIndex + 2);

  offenseAnchors.forEach((anchor, index) => {
    anchor.x += attackDir * [42, 34, 28, 18, 12][index];
    anchor.y += [-6, -18, 16, 24, 8][index];
  });

  defenseAnchors.forEach((anchor, index) => {
    anchor.x -= attackDir * [8, 18, 18, 12, 10][index];
    anchor.y += [-2, -10, 10, 12, 4][index];
  });

  switch (actionType) {
    case '3pt':
      offenseAnchors[handlerIndex].x += attackDir * 56;
      offenseAnchors[handlerIndex].y -= 42;
      offenseAnchors[4].x += attackDir * 20;
      break;
    case '2pt':
      offenseAnchors[handlerIndex].x += attackDir * 42;
      offenseAnchors[handlerIndex].y -= 12;
      break;
    case 'drive':
      offenseAnchors[handlerIndex].x += attackDir * 78;
      offenseAnchors[handlerIndex].y += 8;
      offenseAnchors[4].x += attackDir * 28;
      break;
    case 'post':
      offenseAnchors[4].x += attackDir * 70;
      offenseAnchors[4].y += 4;
      offenseAnchors[0].x -= attackDir * 18;
      break;
    case 'pass':
      offenseAnchors[handlerIndex].x += attackDir * 28;
      offenseAnchors[receiverIndex].x += attackDir * 58;
      offenseAnchors[receiverIndex].y += receiverIndex < 2 ? -28 : 24;
      break;
    case 'steal':
      defenseAnchors[1].x += offenseTeam === 'my' ? -48 : 48;
      defenseAnchors[1].y -= 14;
      break;
  }

  defenseAnchors[0].x = offenseAnchors[handlerIndex].x - attackDir * 42;
  defenseAnchors[0].y = offenseAnchors[handlerIndex].y + 10;
  defenseAnchors[4].x = offenseTeam === 'my'
    ? metrics.left + metrics.width * 0.17
    : metrics.right - metrics.width * 0.17;
  defenseAnchors[4].y = metrics.midY + 16;

  visual.offense = offenseTeam;
  visual.actionType = actionType;

  getVisualTeam('my').forEach((player, index) => {
    const anchor = myAnchors[index];
    player.tx = anchor.x;
    player.ty = anchor.y;
    if (player.x === 0 && player.y === 0) {
      player.x = anchor.x;
      player.y = anchor.y;
    }
  });

  getVisualTeam('opp').forEach((player, index) => {
    const anchor = oppAnchors[index];
    player.tx = anchor.x;
    player.ty = anchor.y;
    if (player.x === 0 && player.y === 0) {
      player.x = anchor.x;
      player.y = anchor.y;
    }
  });

  if (visual.ball.mode === 'hold' || visual.ball.mode === 'free') {
    setBallOwner(offenseTeam, handlerIndex);
  }
}

function setBallOwner(team, ownerIndex) {
  const visual = ensureMatchVisualState();
  const owner = getVisualPlayer(team, ownerIndex);
  if (!visual || !owner) return;

  visual.ball.mode = 'hold';
  visual.ball.ownerTeam = team;
  visual.ball.ownerIndex = owner.index;
  visual.ball.endMode = 'hold';
  visual.ball.endTeam = team;
  visual.ball.endIndex = owner.index;
  visual.ball.x = owner.x + (team === 'my' ? -12 : 12);
  visual.ball.y = owner.y - 2;
  visual.ball.z = 0;
}

function animateBallPass(team, fromIndex, toIndex, intercepted = false) {
  const visual = ensureMatchVisualState();
  const from = getVisualPlayer(team, fromIndex);
  const targetTeam = intercepted ? (team === 'my' ? 'opp' : 'my') : team;
  const targetIndex = intercepted ? 1 : toIndex;
  const to = getVisualPlayer(targetTeam, targetIndex);
  if (!visual || !from || !to) return;

  visual.ball.mode = 'pass';
  visual.ball.fromX = from.x;
  visual.ball.fromY = from.y;
  visual.ball.toX = to.tx;
  visual.ball.toY = to.ty;
  visual.ball.startTs = performance.now();
  visual.ball.duration = 360;
  visual.ball.arc = 26;
  visual.ball.endMode = 'hold';
  visual.ball.endTeam = targetTeam;
  visual.ball.endIndex = targetIndex;
}

function animateBallShot(team, fromIndex, longRange = false) {
  const visual = ensureMatchVisualState();
  const shooter = getVisualPlayer(team, fromIndex);
  const canvas = document.getElementById('courtCanvas');
  const metrics = getCourtMetrics(canvas?.width || 900, canvas?.height || 540);
  if (!visual || !shooter) return;

  visual.ball.mode = 'shot';
  visual.ball.fromX = shooter.x;
  visual.ball.fromY = shooter.y;
  visual.ball.toX = team === 'my' ? metrics.rimLeftX : metrics.rimRightX;
  visual.ball.toY = metrics.rimY - 4;
  visual.ball.startTs = performance.now();
  visual.ball.duration = longRange ? 520 : 430;
  visual.ball.arc = longRange ? 56 : 42;
  visual.ball.endMode = 'free';
  visual.ball.endTeam = team;
  visual.ball.endIndex = fromIndex;
}

function playVisualEvent(team, actionType, payload = {}) {
  const otherTeam = team === 'my' ? 'opp' : 'my';

  if (actionType === 'pass' && !payload.success) {
    setVisualTargets(otherTeam, 'drive', { handlerIndex: 1 });
    animateBallPass(team, payload.passerIndex ?? 0, payload.receiverIndex ?? 2, true);
    return;
  }

  if (actionType === 'steal' && !payload.success) {
    setVisualTargets(otherTeam, 'drive', { handlerIndex: 1 });
    animateBallShot(otherTeam, 1, false);
    return;
  }

  setVisualTargets(team, actionType, payload);

  if (actionType === 'pass') {
    animateBallPass(team, payload.passerIndex ?? 0, payload.receiverIndex ?? 2, false);
  } else {
    animateBallShot(team, payload.handlerIndex ?? 0, actionType === '3pt');
  }
}

function updateVisualAnimation(ts) {
  const visual = ensureMatchVisualState();
  if (!visual) return;

  const dt = visual.lastTs ? Math.min(32, ts - visual.lastTs) / 16.666 : 1;
  visual.lastTs = ts;
  visual.pulse = ts * 0.0015;

  [...visual.myPlayers, ...visual.oppPlayers].forEach((player) => {
    const bobX = Math.sin(visual.pulse + player.bob) * 2.2;
    const bobY = Math.cos(visual.pulse * 0.82 + player.bob) * 1.8;
    player.x += ((player.tx + bobX) - player.x) * player.speed * dt * 1.8;
    player.y += ((player.ty + bobY) - player.y) * player.speed * dt * 1.8;
  });

  const ball = visual.ball;
  if (ball.mode === 'hold') {
    const owner = getVisualPlayer(ball.ownerTeam, ball.ownerIndex);
    if (owner) {
      ball.x += ((owner.x + (ball.ownerTeam === 'my' ? -12 : 12)) - ball.x) * 0.24 * dt;
      ball.y += ((owner.y - 2) - ball.y) * 0.24 * dt;
      ball.z = Math.max(0, Math.sin(visual.pulse * 3 + owner.index) * 2);
    }
    return;
  }

  if (ball.mode === 'free') {
    ball.z += (0 - ball.z) * 0.22 * dt;
    return;
  }

  const progress = clamp((ts - ball.startTs) / ball.duration, 0, 1);
  ball.x = ball.fromX + (ball.toX - ball.fromX) * progress;
  ball.y = ball.fromY + (ball.toY - ball.fromY) * progress;
  ball.z = Math.sin(progress * Math.PI) * ball.arc;

  if (progress >= 1) {
    if (ball.endMode === 'hold') {
      setBallOwner(ball.endTeam, ball.endIndex);
    } else {
      ball.mode = 'free';
      ball.z = 0;
    }
  }
}

function drawCourt() {
  const canvas = document.getElementById('courtCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const metrics = getCourtMetrics(W, H);
  const visual = ensureMatchVisualState();

  ctx.clearRect(0, 0, W, H);

  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 80, W * 0.5, H * 0.5, W * 0.65);
  bgGrad.addColorStop(0, '#11213a');
  bgGrad.addColorStop(1, '#060a18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.fillRect(metrics.left - 10, metrics.top - 10, metrics.width + 20, metrics.height + 20);

  const floorGrad = ctx.createLinearGradient(metrics.left, metrics.top, metrics.right, metrics.bottom);
  floorGrad.addColorStop(0, '#7b3b0d');
  floorGrad.addColorStop(0.5, '#a35317');
  floorGrad.addColorStop(1, '#6a310b');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(metrics.left, metrics.top, metrics.width, metrics.height);

  for (let x = metrics.left; x < metrics.right; x += 28) {
    ctx.fillStyle = ((Math.floor((x - metrics.left) / 28) % 2) === 0)
      ? 'rgba(255,255,255,.035)'
      : 'rgba(0,0,0,.08)';
    ctx.fillRect(x, metrics.top, 14, metrics.height);
    ctx.strokeStyle = 'rgba(50,20,6,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, metrics.top);
    ctx.lineTo(x, metrics.bottom);
    ctx.stroke();
  }

  ctx.fillStyle = `${G.team.color}12`;
  ctx.fillRect(metrics.left, metrics.keyTop, metrics.keyW, metrics.keyH);
  ctx.fillStyle = `${(matchState?.oppTeam?.color || '#999')}14`;
  ctx.fillRect(metrics.right - metrics.keyW, metrics.keyTop, metrics.keyW, metrics.keyH);

  ctx.strokeStyle = 'rgba(255,248,240,.26)';
  ctx.lineWidth = 2;
  ctx.strokeRect(metrics.left, metrics.top, metrics.width, metrics.height);
  ctx.beginPath();
  ctx.moveTo(metrics.midX, metrics.top);
  ctx.lineTo(metrics.midX, metrics.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(metrics.midX, metrics.midY, metrics.centerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,240,.18)';
  ctx.beginPath();
  ctx.arc(metrics.midX, metrics.midY, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeRect(metrics.left, metrics.keyTop, metrics.keyW, metrics.keyH);
  ctx.strokeRect(metrics.right - metrics.keyW, metrics.keyTop, metrics.keyW, metrics.keyH);

  ctx.beginPath();
  ctx.arc(metrics.left + metrics.keyW, metrics.midY, metrics.keyH * 0.28, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(metrics.right - metrics.keyW, metrics.midY, metrics.keyH * 0.28, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(metrics.rimLeftX, metrics.rimY, metrics.arcR, Math.PI * 1.68, Math.PI * 0.32, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(metrics.rimRightX, metrics.rimY, metrics.arcR, Math.PI * 0.68, Math.PI * 1.32);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(metrics.rimLeftX, metrics.rimY, metrics.restrictedR, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(metrics.rimRightX, metrics.rimY, metrics.restrictedR, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.font = '900 24px Barlow Condensed,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HARDWOOD', metrics.midX, metrics.midY + 8);

  drawHoop(ctx, metrics.rimLeftX, metrics.rimY, G.team.color, true);
  drawHoop(ctx, metrics.rimRightX, metrics.rimY, matchState?.oppTeam?.color || '#888', false);

  if (!visual) return;

  const ballOwner = visual.ball.mode === 'hold'
    ? `${visual.ball.ownerTeam}-${visual.ball.ownerIndex}`
    : '';

  visual.myPlayers.forEach((player, index) => {
    drawPlayer(
      ctx,
      player.x,
      player.y,
      G.team.color,
      matchState.myRoster[index]?.pos || 'P',
      matchState.myRoster[index]?.matchPts || 0,
      ballOwner === `my-${index}`
    );
  });

  visual.oppPlayers.forEach((player, index) => {
    drawPlayer(
      ctx,
      player.x,
      player.y,
      matchState.oppTeam.color || '#888',
      matchState.oppRoster[index]?.pos || 'P',
      matchState.oppRoster[index]?.matchPts || 0,
      ballOwner === `opp-${index}`
    );
  });

  drawBall(ctx, visual.ball);
}

function drawHoop(ctx, x, y, color, isLeft) {
  const boardX = isLeft ? x - 22 : x + 10;

  ctx.fillStyle = 'rgba(210,225,255,.18)';
  ctx.fillRect(boardX, y - 32, 12, 64);
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX, y - 32, 12, 64);

  ctx.strokeStyle = color || '#e05c00';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(isLeft ? x + 6 : x - 6, y, 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.28)';
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath();
    ctx.moveTo((isLeft ? x + 6 : x - 6) + i, y + 13);
    ctx.lineTo((isLeft ? x + 6 : x - 6) + i * 0.4, y + 30);
    ctx.stroke();
  }
}

function drawPlayer(ctx, x, y, color, pos, pts, hasBall) {
  ctx.fillStyle = 'rgba(0,0,0,.26)';
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (hasBall) {
    ctx.strokeStyle = 'rgba(255,215,0,.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = color || '#3d7fff';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '700 10px Barlow Condensed,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pos, x, y + 3);

  if (pts > 0) {
    ctx.fillStyle = 'rgba(255,215,0,.95)';
    ctx.font = '700 8px Barlow Condensed,sans-serif';
    ctx.fillText(pts + 'pts', x, y - 18);
  }
}

function drawBall(ctx, ball) {
  const shadowAlpha = 0.16 + ball.z / 220;
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(ball.x, ball.y + 10, 10 + ball.z * 0.04, 5 + ball.z * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();

  const by = ball.y - ball.z;
  const grad = ctx.createRadialGradient(ball.x - 3, by - 4, 2, ball.x, by, 12);
  grad.addColorStop(0, '#ffb15c');
  grad.addColorStop(0.45, '#e1781d');
  grad.addColorStop(1, '#8b3b05');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, by, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(80,30,0,.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ball.x - 10, by);
  ctx.lineTo(ball.x + 10, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ball.x, by - 10);
  ctx.lineTo(ball.x, by + 10);
  ctx.stroke();
}
