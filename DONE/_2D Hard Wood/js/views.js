// ═══════════════════════════════════════
//  views.js — All tab render functions
// ═══════════════════════════════════════

// ── Shared helpers ────────────────────────────────────────────
function statBar(label, val, color) {
  return `<div class="stat-bar">
    <div class="stat-bar-lbl"><span>${label}</span><span>${val}</span></div>
    <div class="stat-bar-track">
      <div class="stat-bar-fill" style="width:${val}%;background:${color}"></div>
    </div>
  </div>`;
}

function updateNavBadges() {
  document.getElementById('navBudget').textContent = `💰 ${G.budget}K`;
  document.getElementById('navSeason').textContent = `Season ${G.season}`;
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const nextMatch  = G.schedule.find(s => !s.played);
  const typeLabel  = { exhibition:'Exhibition', cup:'🏆 Cup', league:'League' }[nextMatch?.type] || '';
  const myOverall  = Math.round(G.roster.reduce((s,p) => s + overallRating(p), 0) / G.roster.length);

  document.getElementById('content').innerHTML = `
    <div class="dash-header">
      <div>
        <h2 style="font-family:var(--font);font-size:2.6em;font-weight:900;letter-spacing:2px;color:#fff">${G.team.name}</h2>
        <div style="font-family:var(--font);font-size:1.4em;color:var(--muted)">${G.team.city} · OVR ${myOverall}</div>
      </div>
      <div style="text-align:right">
        <div class="stat-big">${G.team.wins}—${G.team.losses}</div>
        <div class="stat-lbl">Season Record</div>
      </div>
    </div>

    ${nextMatch ? `
    <div class="next-match" style="margin-bottom:24px">
      <div>
        <div style="font-family:var(--font);font-size:.7em;letter-spacing:3px;color:var(--muted);margin-bottom:10px">
          ${typeLabel.toUpperCase()} — NEXT MATCH
        </div>
        <div class="match-vs">
          <div class="team-badge" style="background:${G.team.color}22;border:2px solid ${G.team.color};color:${G.team.color}">
            ${G.team.name.slice(0,3).toUpperCase()}
          </div>
          <span class="vs-text">VS</span>
          <div>
            <div style="font-family:var(--font);font-size:1.4em;font-weight:700">${nextMatch.opp}</div>
            <div style="font-size:.8em;color:var(--muted);margin-top:2px">${typeLabel}</div>
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="startMatch(${G.schedule.indexOf(nextMatch)})">▶ PLAY MATCH</button>
    </div>
    ` : '<div class="panel" style="margin-bottom:24px"><div class="empty-state">🏆 Season complete! Check league standings.</div></div>'}

    <div class="grid3" style="margin-bottom:24px">
      <div class="panel">
        <div class="panel-title">Team Overall</div>
        <div class="stat-big" style="color:${G.team.color}">${myOverall}</div>
        <div class="stat-lbl">Average Rating</div>
      </div>
      <div class="panel">
        <div class="panel-title">Budget</div>
        <div class="stat-big text-gold">${G.budget}K</div>
        <div class="stat-lbl">Available Funds</div>
      </div>
      <div class="panel">
        <div class="panel-title">Current Tactic</div>
        <div style="font-family:var(--font);font-size:1.3em;font-weight:700;margin-top:4px">
          ${TACTICS_LIST.find(t => t.id === G.team.tactic)?.name || '—'}
        </div>
        <div class="stat-lbl">Formation: ${G.team.formation}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="panel">
        <div class="panel-title">League Standings</div>
        ${renderMiniStandings()}
      </div>
      <div class="panel">
        <div class="panel-title">Roster Overview</div>
        ${G.roster.map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
            <div>
              <span style="font-family:var(--font);font-size:1em;font-weight:700">${p.name}</span>
              <span class="tag tag-blue" style="margin-left:6px">${p.pos}</span>
            </div>
            <div style="font-family:var(--font);font-size:1.1em;font-weight:700;color:${G.team.color}">${overallRating(p)}</div>
          </div>`).join('')}
      </div>
    </div>
  `;
}

function renderMiniStandings() {
  const teams = [
    { name:G.team.name, wins:G.team.wins, losses:G.team.losses, isMe:true },
    ...G.aiTeams.map(t => ({ name:t.name, wins:t.wins, losses:t.losses, isMe:false }))
  ].sort((a,b) => b.wins - a.wins || a.losses - b.losses);

  return teams.slice(0,6).map((t,i) => `
    <div class="standings-row ${t.isMe ? 'my-team' : ''}">
      <span class="s-rank">${i+1}</span>
      <span class="s-name">${t.name} ${t.isMe ? '<span class="tag tag-blue" style="font-size:.6em">YOU</span>' : ''}</span>
      <span class="s-rec">${t.wins}W ${t.losses}L</span>
      <span class="s-pts">${t.wins * 2}pts</span>
    </div>`).join('');
}

// ── ROSTER ────────────────────────────────────────────────────
function renderRoster() {
  const cards = G.roster.map((p,i) => `
    <div class="player-card ${p.starter ? 'starter' : ''}">
      <div class="player-num">#${p.num}</div>
      <div class="player-name">${p.name}</div>
      <div class="player-pos">${p.pos} · ${POS_NAMES[p.pos] || p.pos}</div>
      ${statBar('Shooting', p.shooting, '#3d7fff')}
      ${statBar('Defense',  p.defense,  '#ff4d6d')}
      ${statBar('Speed',    p.speed,    '#00e676')}
      ${statBar('Strength', p.strength, '#ffd700')}
      ${statBar('IQ',       p.iq,       '#a855f7')}
      <div class="energy-indicator">
        ${[...Array(5)].map((_,j) => `<div class="energy-dot ${p.energy >= (j+1)*20 ? 'on' : ''}"></div>`).join('')}
        <span style="margin-left:6px;font-size:.72em;color:var(--muted)">Energy ${p.energy}%</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;align-items:center">
        <span class="salary-tag">💰 ${p.salary}K/season</span>
        <span style="font-family:var(--font);font-size:1.1em;font-weight:700;color:${G.team.color}">${overallRating(p)} OVR</span>
      </div>
    </div>`).join('');

  document.getElementById('content').innerHTML = `
    <div class="flex-between" style="margin-bottom:20px">
      <h3 class="section-title">ROSTER</h3>
      <div class="flex-gap">
        <span style="font-size:.85em;color:var(--muted)">
          Salary cap: ${G.roster.reduce((s,p) => s + p.salary, 0)}K / 600K
        </span>
        <button class="btn btn-outline btn-sm" onclick="showTab('market')">+ Sign Player</button>
      </div>
    </div>
    <div class="grid3">${cards}</div>
  `;
}

// ── TACTICS ──────────────────────────────────────────────────
function renderTactics() {
  const formations = ['2-1-2','1-3-1','2-3','3-2','1-2-2'];
  const current    = TACTICS_LIST.find(t => t.id === G.team.tactic);

  document.getElementById('content').innerHTML = `
    <h3 class="section-title">TACTICS</h3>
    <div class="grid2">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-title">Offensive System</div>
          <div class="grid2">
            ${TACTICS_LIST.map(t => `
              <div class="tactic-card ${t.id === G.team.tactic ? 'active' : ''}" onclick="setTactic('${t.id}')">
                <div class="tactic-name">${t.name}</div>
                <div class="tactic-desc">${t.desc}</div>
                <div class="tactic-bonus">${t.bonus}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">Formation</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${formations.map(f => `
              <button class="formation-btn ${f === G.team.formation ? 'active' : ''}" onclick="setFormation('${f}')">${f}</button>
            `).join('')}
          </div>
          <div style="margin-top:12px;font-size:.85em;color:var(--muted)">
            Formation affects spacing, transition speed, and rebounding position.
          </div>
        </div>
      </div>
      <div class="panel" style="text-align:center">
        <div class="panel-title">Court View — ${G.team.formation}</div>
        <canvas id="tacticsCanvas" width="300" height="340"
          style="border-radius:8px;background:var(--bg3)"></canvas>
        <div style="margin-top:14px">
          <div style="font-family:var(--font);font-size:1.1em;font-weight:700">Active: ${current?.name || '—'}</div>
          <div style="font-size:.85em;color:var(--muted);margin-top:4px">${current?.desc || ''}</div>
          <div style="color:var(--green);font-size:.82em;margin-top:6px;font-family:var(--font)">${current?.bonus || ''}</div>
        </div>
      </div>
    </div>
  `;
  drawTacticsCourt();
}

function setTactic(id) {
  G.team.tactic = id;
  saveGame();
  renderTactics();
  notify('Tactic updated!', 'success');
}

function setFormation(f) {
  G.team.formation = f;
  saveGame();
  renderTactics();
  notify('Formation updated!', 'success');
}

function drawTacticsCourt() {
  const canvas = document.getElementById('tacticsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#1a0a04';
  ctx.fillRect(0, 0, W, H);

  const floorGrad = ctx.createLinearGradient(0, H * .3, 0, H);
  floorGrad.addColorStop(0, '#4a2206');
  floorGrad.addColorStop(1, '#2a1004');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, H * .3, W, H * .7);

  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(10, H * .3, W - 20, H * .7 - 10);
  ctx.beginPath(); ctx.arc(W/2, H * .65, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, H * .3); ctx.lineTo(W/2, H - .5); ctx.stroke();
  ctx.strokeRect(10, H * .45, 80, 80);
  ctx.strokeRect(W - 90, H * .45, 80, 80);
  ctx.beginPath(); ctx.arc(W/2, H + 80, 260, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

  const formPos = {
    '2-1-2': [[W*.2,H*.55],[W*.8,H*.55],[W*.5,H*.65],[W*.2,H*.8],[W*.8,H*.8]],
    '1-3-1': [[W*.5,H*.45],[W*.2,H*.6],[W*.5,H*.65],[W*.8,H*.6],[W*.5,H*.82]],
    '2-3':   [[W*.3,H*.5],[W*.7,H*.5],[W*.2,H*.72],[W*.5,H*.78],[W*.8,H*.72]],
    '3-2':   [[W*.2,H*.52],[W*.5,H*.48],[W*.8,H*.52],[W*.3,H*.74],[W*.7,H*.74]],
    '1-2-2': [[W*.5,H*.44],[W*.3,H*.6],[W*.7,H*.6],[W*.2,H*.78],[W*.8,H*.78]],
  };
  const positions = formPos[G.team.formation] || formPos['2-1-2'];

  positions.forEach((pos, i) => {
    if (i > 0) {
      ctx.strokeStyle = `${G.team.color}33`; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(positions[0][0], positions[0][1]);
      ctx.lineTo(pos[0], pos[1]);
      ctx.stroke();
    }
    ctx.fillStyle = G.team.color;
    ctx.beginPath(); ctx.arc(pos[0], pos[1], 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Barlow Condensed,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(POSITIONS[i], pos[0], pos[1] + 3);
  });
}

// ── TRAINING ─────────────────────────────────────────────────
function renderTraining() {
  const slotsLeft = G.maxTraining - G.trainingUsed;

  const slots = TRAINING_LIST.map(t => {
    const locked     = G.trainingUsed >= G.maxTraining && t.id !== 'recovery';
    const cantAfford = G.budget < t.cost;
    return `
      <div class="training-slot ${locked || cantAfford ? 'locked' : ''}"
           onclick="${locked || cantAfford ? '' : `doTraining('${t.id}')`}">
        <div class="training-icon">${t.icon}</div>
        <div class="training-name">${t.name}</div>
        <div class="training-desc">${t.desc}</div>
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
          <span class="tag ${t.stat === 'energy' ? 'tag-green' : 'tag-blue'}">+${t.gain} ${t.stat.toUpperCase()}</span>
          <span class="training-cost">💰 ${t.cost}K</span>
        </div>
        ${cantAfford ? `<div style="margin-top:8px;font-size:.75em;color:var(--accent2)">Insufficient budget</div>` : ''}
      </div>`;
  }).join('');

  const energyRows = G.roster.map(p => `
    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-family:var(--font);font-size:.95em;font-weight:600">${p.name}</div>
        <div style="height:5px;background:rgba(255,255,255,.06);border-radius:3px;margin-top:5px;overflow:hidden">
          <div style="height:100%;width:${p.energy}%;
               background:${p.energy > 60 ? 'var(--green)' : p.energy > 30 ? '#ffd700' : 'var(--accent2)'};
               border-radius:3px;transition:width .5s"></div>
        </div>
      </div>
      <span style="font-family:var(--font);font-size:.9em;
            color:${p.energy > 60 ? 'var(--green)' : p.energy > 30 ? 'var(--gold)' : 'var(--accent2)'}">
        ${p.energy}%
      </span>
    </div>`).join('');

  document.getElementById('content').innerHTML = `
    <div class="flex-between" style="margin-bottom:20px">
      <h3 class="section-title">TRAINING</h3>
      <span class="tag tag-${slotsLeft > 0 ? 'green' : 'gray'}">${slotsLeft} session${slotsLeft !== 1 ? 's' : ''} left this week</span>
    </div>
    <div style="margin-bottom:20px;font-size:.88em;color:var(--muted)">
      Training improves specific stats for ALL players. Each game week allows ${G.maxTraining} sessions.
    </div>
    <div class="grid3">${slots}</div>
    <div class="panel" style="margin-top:24px">
      <div class="panel-title">Player Energy Status</div>
      <div class="grid3">${energyRows}</div>
    </div>
  `;
}

function doTraining(id) {
  const t = TRAINING_LIST.find(x => x.id === id);
  if (!t) return;
  if (G.budget < t.cost)              { notify('Not enough budget!', 'error');      return; }
  if (G.trainingUsed >= G.maxTraining && id !== 'recovery') { notify('No training slots left!', 'error'); return; }

  G.budget -= t.cost;
  G.trainingUsed++;

  if (t.stat === 'energy') {
    G.roster.forEach(p => { p.energy = clamp(p.energy + t.gain, 0, 100); });
    notify('Players recovered energy!', 'success');
  } else {
    G.roster.forEach(p => { p[t.stat] = clamp(p[t.stat] + rnd(1, t.gain), 0, 99); });
    notify(`${t.name} complete! +${t.stat}`, 'success');
  }

  saveGame();
  renderTraining();
}

// ── MARKET ───────────────────────────────────────────────────
function renderMarket() {
  if (!marketPool.length) marketPool = generateMarket();

  const freeAgents = marketPool.map((p,i) => {
    const canAfford = G.budget >= p.salary * 3;
    return `
      <div class="market-player">
        <div class="market-avatar" style="background:${p.color}22;border:2px solid ${p.color};color:${p.color}">${p.pos}</div>
        <div class="market-info">
          <div class="market-name">${p.name}</div>
          <div class="market-pos">${p.pos} · ${POS_NAMES[p.pos] || p.pos}</div>
          <div class="market-stats">
            <span class="mstat">SHT <span>${p.shooting}</span></span>
            <span class="mstat">DEF <span>${p.defense}</span></span>
            <span class="mstat">SPD <span>${p.speed}</span></span>
            <span class="mstat">IQ <span>${p.iq}</span></span>
            <span class="mstat">OVR <span style="color:var(--accent)">${overallRating(p)}</span></span>
          </div>
        </div>
        <div style="text-align:right">
          <div class="market-price">${p.salary * 3}K</div>
          <div style="font-size:.72em;color:var(--muted);margin-bottom:6px">${p.salary}K/season</div>
          <button class="btn btn-gold btn-xs" ${canAfford ? '' : 'disabled'} onclick="signPlayer(${i})">
            ${canAfford ? 'SIGN' : 'Need ' + (p.salary * 3 - G.budget) + 'K more'}
          </button>
        </div>
      </div>`;
  }).join('');

  const myRosterRows = G.roster.map((p,i) => `
    <div class="market-player">
      <div class="market-avatar" style="background:${G.team.color}22;border:2px solid ${G.team.color};color:${G.team.color}">${p.pos}</div>
      <div class="market-info">
        <div class="market-name">${p.name}</div>
        <div class="market-pos">${p.pos} · OVR ${overallRating(p)}</div>
      </div>
      <div style="text-align:right">
        <div class="market-price" style="color:var(--muted)">${p.salary}K/season</div>
        <div style="font-size:.72em;color:var(--green);margin-bottom:6px">+${Math.round(p.salary * .3)}K on release</div>
        ${G.roster.length > 5
          ? `<button class="btn btn-danger btn-xs" onclick="releasePlayer(${i})">RELEASE</button>`
          : `<span style="font-size:.72em;color:var(--muted)">Min 5 players</span>`}
      </div>
    </div>`).join('');

  document.getElementById('content').innerHTML = `
    <div class="flex-between" style="margin-bottom:20px">
      <h3 class="section-title">FREE AGENT MARKET</h3>
      <div class="flex-gap">
        <span class="tag tag-gold">Budget: ${G.budget}K</span>
        <button class="btn btn-outline btn-sm" onclick="refreshMarket()">↻ Refresh</button>
      </div>
    </div>
    <div style="margin-bottom:14px;font-size:.85em;color:var(--muted)">
      Sign players to strengthen your roster. Releasing a player returns 30% of their salary.
    </div>
    <div style="margin-bottom:28px">
      <div class="panel-title">Free Agents Available</div>
      ${freeAgents}
    </div>
    <div class="panel">
      <div class="panel-title">Your Roster — Release Players</div>
      ${myRosterRows}
    </div>
  `;
}

// ── SCHEDULE ─────────────────────────────────────────────────
function renderSchedule() {
  const typeColors = { exhibition:'var(--muted)', cup:'var(--gold)', league:'var(--accent)' };
  const typeIcons  = { exhibition:'🏀', cup:'🏆', league:'⚔' };
  const played     = G.schedule.filter(s => s.played);

  const rows = G.schedule.map((s,i) => {
    const isCurrent = !s.played && G.schedule.findIndex(x => !x.played) === i;
    return `
      <div class="schedule-match ${s.played ? (s.win ? 'played-w' : 'played-l') : isCurrent ? 'current' : ''}">
        <span class="sched-type" style="color:${typeColors[s.type]}">${typeIcons[s.type]} ${s.type.toUpperCase()}</span>
        <span class="sched-opp">${s.opp}</span>
        <span class="sched-result ${s.played ? (s.win ? 'win' : 'loss') : ''}">
          ${s.played ? (s.win ? `✅ W ${s.myScore}–${s.oppScore}` : `❌ L ${s.myScore}–${s.oppScore}`) : '—'}
        </span>
        <div>
          ${isCurrent
            ? `<button class="btn btn-primary btn-xs" onclick="startMatch(${i})">▶ PLAY</button>`
            : s.played
              ? `<span style="font-size:.75em;color:var(--muted)">Completed</span>`
              : `<span style="font-size:.75em;color:var(--muted)">Upcoming</span>`}
        </div>
      </div>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="flex-between" style="margin-bottom:20px">
      <h3 class="section-title">SEASON SCHEDULE</h3>
      <div class="flex-gap">
        <span class="tag tag-green">${played.filter(s => s.win).length}W</span>
        <span class="tag tag-red">${played.filter(s => !s.win).length}L</span>
        <span class="tag tag-gray">${G.schedule.filter(s => !s.played).length} remaining</span>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <div style="display:flex;gap:16px;font-size:.78em;color:var(--muted);
           font-family:var(--font);letter-spacing:2px;text-transform:uppercase;
           padding:0 16px 8px;border-bottom:1px solid var(--border)">
        <span style="width:90px">Type</span>
        <span style="flex:1">Opponent</span>
        <span style="width:100px">Result</span>
        <span style="width:80px"></span>
      </div>
    </div>
    ${rows}
  `;
}

// ── LEAGUE ───────────────────────────────────────────────────
function renderLeague() {
  const leagueMatches = G.schedule.filter(s => s.type === 'league' && s.played);
  const myPts    = leagueMatches.reduce((t,s) => t + (s.win ? 2 : 1), 0);
  const myScored = leagueMatches.reduce((t,s) => t + s.myScore, 0);
  const myConceded = leagueMatches.reduce((t,s) => t + s.oppScore, 0);

  const all = [
    {
      name: G.team.name, city: G.team.city, color: G.team.color,
      wins: G.team.wins, losses: G.team.losses, isMe: true,
      pts: myPts, scored: myScored, conceded: myConceded,
    },
    ...G.aiTeams.map(t => ({
      name: t.name, city: t.city, color: t.color,
      wins: t.wins, losses: t.losses, isMe: false,
      pts:  t.wins * 2 + Math.floor(t.losses * .5),
      scored:   rnd(400, 700),
      conceded: rnd(350, 680),
    }))
  ].sort((a,b) => b.pts - a.pts || b.wins - a.wins);

  const leagueRows = all.map((t,i) => `
    <div class="league-row ${t.isMe ? 'my-row' : ''}">
      <span style="font-weight:700;color:${i < 3 ? 'var(--gold)' : 'var(--muted)'}">${i+1}</span>
      <span>
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.color};margin-right:7px"></span>
        ${t.name} ${t.isMe ? '<span class="tag tag-blue" style="font-size:.58em">YOU</span>' : ''}
      </span>
      <span style="color:var(--green)">${t.wins}</span>
      <span style="color:var(--accent2)">${t.losses}</span>
      <span>${t.wins + t.losses}</span>
      <span style="color:${t.scored - t.conceded >= 0 ? 'var(--green)' : 'var(--accent2)'}">
        ${t.scored - t.conceded >= 0 ? '+' : ''}${t.scored - t.conceded}
      </span>
      <span style="font-weight:700;color:var(--accent)">${t.pts}</span>
    </div>`).join('');

  const cupRows = G.schedule.filter(s => s.type === 'cup').map(s => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <div>
        <span class="tag tag-gold" style="margin-right:8px">${s.cupRound || 'Cup'}</span>
        <span style="font-family:var(--font)">${G.team.name} vs ${s.opp}</span>
      </div>
      <span class="${s.played ? 'text-' + (s.win ? 'green' : 'red') : 'text-muted'}"
            style="font-family:var(--font);font-weight:700">
        ${s.played ? (s.win ? `W ${s.myScore}–${s.oppScore}` : `L ${s.myScore}–${s.oppScore}`) : 'TBD'}
      </span>
    </div>`).join('');

  document.getElementById('content').innerHTML = `
    <h3 class="section-title">LEAGUE STANDINGS</h3>
    <div class="panel" style="margin-bottom:24px">
      <div class="league-header">
        <span>#</span><span>Team</span><span>W</span><span>L</span><span>GP</span><span>+/-</span><span>Pts</span>
      </div>
      ${leagueRows}
    </div>
    <div class="grid2">
      <div class="panel">
        <div class="panel-title">Cup Bracket</div>
        ${cupRows || '<div class="empty-state">No cup matches yet.</div>'}
      </div>
      <div class="panel">
        <div class="panel-title">Your Season Stats</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="flex-between"><span class="text-muted">Total Wins</span>   <span style="font-family:var(--font);font-weight:700;color:var(--green)">${G.team.wins}</span></div>
          <div class="flex-between"><span class="text-muted">Total Losses</span> <span style="font-family:var(--font);font-weight:700;color:var(--accent2)">${G.team.losses}</span></div>
          <div class="flex-between"><span class="text-muted">Budget</span>        <span style="font-family:var(--font);font-weight:700;color:var(--gold)">${G.budget}K</span></div>
          <div class="flex-between"><span class="text-muted">Tactic</span>        <span style="font-family:var(--font)">${TACTICS_LIST.find(t => t.id === G.team.tactic)?.name || '—'}</span></div>
          <div class="flex-between"><span class="text-muted">Team OVR</span>      <span style="font-family:var(--font);font-weight:700;color:${G.team.color}">${Math.round(G.roster.reduce((s,p) => s + overallRating(p), 0) / G.roster.length)}</span></div>
        </div>
      </div>
    </div>
  `;
}