// ══════════════════════════════════════════════════════════════
//  2D BASKET SIM — script.js  (v3)
//  • Physics: spin, rim/backboard bounces, ball drops through the net
//  • Modes: Classic (30 s + time bonus + buzzer beater)
//           Precision (10 shots, distance rises)
//           Survival (3 lives, moving hoop, wind)
//  • Points from the real shot distance, matching the court zones
// ══════════════════════════════════════════════════════════════

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

const W = 820;
const H = 520;

// Crisp rendering on high-DPI screens (game logic stays in W×H units)
function setupCanvasResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    courtCache = null;
}
window.addEventListener("resize", setupCanvasResolution);

// ── Audio ──────────────────────────────────────────────────────
let audioCtx = null;
let muted = false;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}
function playTone(freq, dur = 0.1, type = "sine", vol = 0.35, delay = 0) {
    if (muted) return;
    try {
        const ac   = getAudio();
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ac.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
        osc.connect(gain); gain.connect(ac.destination);
        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + dur + 0.01);
    } catch(e) {}
}
function soundScore(pts, swish) {
    if (swish) {
        playTone(900,.06,"sine",.3,0); playTone(1200,.08,"sine",.35,.06);
        playTone(1600,.12,"sine",.4,.13);
    }
    if (pts === 3) {
        playTone(523,.1,"sine",.5,0); playTone(659,.1,"sine",.5,.1);
        playTone(784,.15,"sine",.5,.2); playTone(1047,.25,"sine",.5,.32);
    } else if (pts === 2) {
        playTone(659,.12,"sine",.45,0); playTone(880,.18,"sine",.45,.12);
    } else {
        playTone(523,.12,"sine",.4,0); playTone(660,.15,"sine",.4,.1);
    }
}
function soundMiss()     { playTone(200,.22,"sawtooth",.25); playTone(160,.2,"sawtooth",.2,.1); }
function soundBounce()   { playTone(280 + Math.random()*60,.07,"sine",.18); }
function soundBackboard(){ playTone(180,.12,"square",.2); }
function soundCombo(n)   { playTone(440 + n*55,.09,"sine",.28); }
function soundLifeLost() { playTone(150,.3,"sawtooth",.35); playTone(100,.4,"sawtooth",.3,.25); }
function soundBuzzer()   { playTone(110,.7,"square",.25); playTone(116,.7,"square",.2); }
function soundTick()     { playTone(1000,.04,"square",.12); }

// ── Scheduled callbacks (cleared on restart/menu) ──────────────
let pendingTimers = [];
function schedule(fn, ms) {
    const id = setTimeout(() => {
        pendingTimers = pendingTimers.filter(t => t !== id);
        fn();
    }, ms);
    pendingTimers.push(id);
}
function clearScheduled() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
}

// ── Particles ──────────────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, color, count = 10, speed = 4) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * .5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * (speed * .5 + Math.random() * speed),
            vy: Math.sin(angle) * (speed * .5 + Math.random() * speed),
            life: 1, decay: .022 + Math.random() * .022,
            size: 3 + Math.random() * 5, color, type: "circle"
        });
    }
}

function spawnFlames(x, y, count = 14) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + (Math.random()-.5)*20,
            y: y + (Math.random()-.5)*10,
            vx: (Math.random()-.5) * 3,
            vy: -(2 + Math.random() * 4),
            life: 1, decay: .028 + Math.random()*.02,
            size: 8 + Math.random()*10,
            color: Math.random() > .5 ? "#FF8C00" : "#ff4400",
            type: "flame"
        });
    }
}

function spawnStars(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 6;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1, decay: .018 + Math.random()*.015,
            size: 4 + Math.random()*5,
            color: "#fff",
            type: "star",
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random()-.5)*.3
        });
    }
}

function spawnConfetti(count = 40) {
    const colors = ["#FF8C00", "#00e5ff", "#ffd60a", "#ff4d6d", "#7CFC00"];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * W, y: -10 - Math.random() * 60,
            vx: (Math.random()-.5) * 2, vy: 1 + Math.random() * 2,
            life: 1, decay: .006 + Math.random() * .006,
            size: 4 + Math.random() * 4,
            color: colors[i % colors.length],
            type: "confetti",
            angle: Math.random() * Math.PI, spin: (Math.random()-.5) * .3
        });
    }
}

function spawnRipple(x, y) {
    particles.push({ x, y, vx:0, vy:0, life:1, decay:.035, size:1, color:"#FF8C00", type:"ripple", r:5 });
}

function spawnSwishTrail(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x + (Math.random()-.5)*10, y: y + (Math.random()-.5)*10,
            vx: (Math.random()-.5)*2, vy: (Math.random()-.5)*2,
            life: 1, decay: .04, size: 5+Math.random()*8,
            color: "#00e5ff", type: "circle"
        });
    }
}

// Ball flame trail
const ballTrail = [];
function updateBallTrail(dt) {
    if (ball.isMoving && combo >= 3) {
        ballTrail.push({ x: ball.x, y: ball.y, life: 1 });
    }
    for (let i = ballTrail.length-1; i >= 0; i--) {
        ballTrail[i].life -= .08 * dt;
        if (ballTrail[i].life <= 0) ballTrail.splice(i,1);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.type === "confetti") { p.vx += Math.sin(p.angle) * .05 * dt; }
        else if (p.type !== "flame") p.vy += 0.15 * dt;
        if (p.type === "star" || p.type === "confetti") p.angle += p.spin * dt;
        if (p.type === "ripple") p.r += 3 * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0 || p.y > H + 40) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        const a = Math.max(0, p.life);
        ctx.globalAlpha = a;
        ctx.fillStyle   = p.color;

        if (p.type === "star") {
            drawStar(ctx, p.x, p.y, 5, p.size * p.life, p.size * p.life * .4, p.angle);
        } else if (p.type === "confetti") {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
            ctx.restore();
        } else if (p.type === "ripple") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2 * p.life;
            ctx.stroke();
        } else if (p.type === "flame") {
            const r = p.size * p.life;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            grad.addColorStop(0, "#fff8");
            grad.addColorStop(.4, p.color);
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(.5, p.size * p.life), 0, Math.PI*2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR, rotation) {
    let rot = rotation - Math.PI/2;
    ctx.beginPath();
    for (let i = 0; i < spikes*2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
        rot += Math.PI / spikes;
    }
    ctx.closePath();
    ctx.fill();
}

// ── Floating score texts ───────────────────────────────────────
const floatTexts = [];
function spawnFloatText(x, y, text, color = "#FF8C00", size = 22) {
    floatTexts.push({ x: Math.max(90, Math.min(W - 90, x)), y, text, color, life: 1, vy: -1.8, size });
}
function updateFloatTexts(dt) {
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        floatTexts[i].y  += floatTexts[i].vy * dt;
        floatTexts[i].life -= 0.016 * dt;
        if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
    }
}
function drawFloatTexts() {
    floatTexts.forEach(f => {
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle   = f.color;
        ctx.strokeStyle = "rgba(0,0,0,.6)";
        ctx.lineWidth   = 3;
        ctx.font        = `bold ${f.size}px 'Oswald', Arial`;
        ctx.textAlign   = "center";
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
}

// ── Highscores ─────────────────────────────────────────────────
const MODE_LABELS = { classic: "CLASSIQUE", timer: "TIMER", defense: "DÉFENSEUR", precision: "PRÉCISION", survival: "SURVIE" };

function getScores(mode = "classic") {
    try { return JSON.parse(localStorage.getItem(`basket_scores_${mode}`)) || []; }
    catch { return []; }
}
function saveScore(s, mode = "classic") {
    const scores = getScores(mode);
    scores.push(s);
    scores.sort((a, b) => b - a);
    scores.length = Math.min(scores.length, 5);
    try { localStorage.setItem(`basket_scores_${mode}`, JSON.stringify(scores)); } catch {}
}
function renderTitleScores() {
    const el = document.getElementById("titleHsList");
    if (!el) return;
    const mode = selectedMode || "classic";
    const scores = getScores(mode);
    const head = `<p class="hs-mode">${MODE_LABELS[mode]}</p>`;
    if (!scores.length) { el.innerHTML = head + '<p class="hs-empty">Aucun score encore</p>'; return; }
    el.innerHTML = head + scores.map((s, i) =>
        `<div class="hs-row"><span>#${i+1}</span><span>${s} pts</span></div>`
    ).join("");
}

// ── Game constants ──────────────────────────────────────────────
const GRAVITY   = 0.38;
const GAME_TIME = 30;
const FLOOR_Y   = H * 0.72;
const MAX_POWER = 18;
const POWER_K   = 0.065;
const SHOT_TIMEOUT = 420;     // frames (~7 s) before a stuck shot counts as a miss

// Distance zones, measured from the point under the hoop (hoop.x, H)
const ZONE_2PT = 280;
const ZONE_3PT = 430;

// ── Hoop config (can move in survival) ─────────────────────────
const BASE_HOOP = { x: 650, y: 220 };
let hoopConfig = {};
function resetHoop(x, y) {
    hoopConfig = {
        x: x || BASE_HOOP.x,
        y: y || BASE_HOOP.y,
        rimRadius: 5,
        innerW: 70,
        rimLeft:  0,
        rimRight: 0,
        backboard: { x: 0, y: 0, w: 12, h: 90 },
        movePhase: 0,
        netPhase: 0,
        netStretch: 0     // 0..1, net pulled down when the ball goes through
    };
    syncHoopGeometry();
}
function syncHoopGeometry() {
    hoopConfig.rimLeft  = hoopConfig.x - hoopConfig.innerW / 2;
    hoopConfig.rimRight = hoopConfig.x + hoopConfig.innerW / 2;
    hoopConfig.backboard.x = hoopConfig.x + hoopConfig.innerW/2 + 30;
    hoopConfig.backboard.y = hoopConfig.y - 40;
}

// ── Shot spots ──────────────────────────────────────────────────
function distFromHoop(x, y) {
    return Math.hypot(x - hoopConfig.x, y - H);
}
function zonePoints(x, y) {
    const d = distFromHoop(x, y);
    return d > ZONE_3PT ? 3 : d > ZONE_2PT ? 2 : 1;
}
function randomSpot() {
    // Precision: distance rises shot after shot. Other modes: random zone.
    let zone;
    if (selectedMode === "precision") {
        const done = 10 - precisionShotsLeft;
        zone = done < 3 ? 1 : done < 7 ? 2 : 3;
    } else {
        const r = Math.random();
        zone = r < .3 ? 1 : r < .7 ? 2 : 3;
    }
    const y = 395 + Math.random() * 50;
    const dy = H - y;
    const ranges = { 1: [150, ZONE_2PT - 25], 2: [ZONE_2PT + 25, ZONE_3PT - 25], 3: [ZONE_3PT + 25, 620] };
    const [dMin, dMax] = ranges[zone];
    const maxX = BASE_HOOP.x - (selectedMode === "survival" ? 180 : 120);
    for (let i = 0; i < 20; i++) {
        const d = dMin + Math.random() * (dMax - dMin);
        const x = BASE_HOOP.x - Math.sqrt(Math.max(0, d*d - dy*dy));
        if (x > 60 && x < maxX) return { x, y };
    }
    return { x: 60 + Math.random() * (maxX - 60), y };
}

// ── Game state ──────────────────────────────────────────────────
let ball, score, highscore, combo, maxCombo;
let shotsTaken, basketsMade, swishCount, threesMade, timeLeft;
let gameRunning, gameStarted, paused, lastTime;
let mouseX, mouseY, aiming;
let streakHistory;
let shakeTimer  = 0;
let shakeAmount = 0;
let flashTimer  = 0;
let flashColor  = "rgba(255,140,0,0)";
let selectedMode = "classic";
let defender = { x: 0, y: 0, handMode: 1, cooldown: 0, blocked: false };
let lives = 3;
let precisionShotsLeft = 10;
let wind = 0;
let crowdHype = 0;
let timeUp = false;
let lastTickSecond = 0;
let courtCache = null;

function setDefenderHands(n) {
    defender.handMode = n === 2 ? 2 : 1;
    document.getElementById("defenseOne")?.classList.toggle("active", defender.handMode === 1);
    document.getElementById("defenseTwo")?.classList.toggle("active", defender.handMode === 2);
}
// ── Mode selection ──────────────────────────────────────────────
function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active"));
    document.querySelector(`.mode-card[data-mode="${mode}"]`)?.classList.add("active");
    renderTitleScores();
    document.getElementById("defenseControls")?.classList.toggle("hidden", mode !== "defense");
}

// ── Reset ───────────────────────────────────────────────────────
function resetBall() {
    const spot = randomSpot();
    ball = {
        x: spot.x, y: spot.y,
        startX: spot.x, startY: spot.y,
        vx: 0, vy: 0,
        radius: 16,
        isMoving: false,
        spin: 0,
        angle: 0,
        rimHits: 0,       // rim/backboard contacts this shot (swish = 0)
        passedAboveHoop: false,
        scored: false,
        resolved: false,  // score or miss already handled
        flightTime: 0
    };
    if (selectedMode === "survival") rollWind();
    defender.blocked = false;
}

function rollWind() {
    // Wind kicks in after 6 baskets in survival
    if (basketsMade < 6) { wind = 0; return; }
    const max = Math.min(0.012 + (basketsMade - 6) * 0.002, 0.03);
    wind = (Math.random() * 2 - 1) * max;
}

function resetGame() {
    clearScheduled();
    score         = 0;
    combo         = 1;
    maxCombo      = 1;
    shotsTaken    = 0;
    basketsMade   = 0;
    swishCount    = 0;
    threesMade    = 0;
    timeLeft      = GAME_TIME;
    lastTickSecond = GAME_TIME;
    timeUp        = false;
    gameRunning   = true;
    paused        = false;
    streakHistory = [];
    shakeTimer    = 0;
    shakeAmount   = 0;
    flashTimer    = 0;
    lives         = 3;
    precisionShotsLeft = 10;
    wind          = 0;
    crowdHype     = 0;
    particles.length   = 0;
    floatTexts.length  = 0;
    ballTrail.length   = 0;
    highscore     = getScores(selectedMode)[0] || 0;
    aiming        = false;
    mouseX        = 0; mouseY = 0;

    resetHoop();
    resetBall();
    setDefenderHands(1);
    document.getElementById("defenseControls")?.classList.toggle("hidden", selectedMode !== "defense");
    defender.x = hoopConfig.x - 75;
    defender.y = hoopConfig.y + 70;
    defender.cooldown = 0;
    updateHUD();
    setMsg(getModeStartMsg());
    updateStreakDisplay();
    document.getElementById("hTimer").classList.remove("timer-low");

    const timerCell = document.getElementById("hudTimerCell");
    const livesCell = document.getElementById("hudLivesCell");
    timerCell.classList.toggle("hidden", selectedMode !== "timer" && selectedMode !== "defense");
    livesCell.classList.toggle("hidden", selectedMode !== "survival");

    const tag = document.getElementById("modeTag");
    if (tag) tag.textContent = { classic:"🏀 CLASSIQUE", timer:"⏱ TIMER", precision:"🎯 PRÉCISION", survival:"💀 SURVIE", defense:"🛡️ DÉFENSE" }[selectedMode] || "";
    updatePauseButton();
}

function getModeStartMsg() {
    if (selectedMode === "classic") return "🏀 Mode libre : marque des points, le panier bouge à 20 points !";
    if (selectedMode === "timer") return "⏱ 30 secondes : swish et tirs à 3 points ajoutent du temps !";
    if (selectedMode === "precision") return `🎯 ${precisionShotsLeft} tirs — de plus en plus loin !`;
    if (selectedMode === "survival")  return "💀 3 ratés et c'est fini !";
    if (selectedMode === "defense") return "🛡️ Défenseur : touches 1 / 2 pour changer les mains !";
    return "Clique pour tirer ! Swish = +2 s, 3 pts = +1 s";
}

// ── UI helpers ──────────────────────────────────────────────────
function setMsg(text) {
    const el = document.getElementById("msgLine");
    if (el) el.textContent = text;
}
function bump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("bump");
    setTimeout(() => el.classList.remove("bump"), 200);
}
function updateHUD() {
    document.getElementById("hScore").textContent = score;
    document.getElementById("hHs").textContent    = Math.max(highscore, score);
    document.getElementById("hCombo").textContent = `x${combo}`;
    document.getElementById("hShots").textContent = selectedMode === "precision"
        ? `${precisionShotsLeft} rest.`
        : shotsTaken;
    document.getElementById("hTimer").textContent = Math.max(0, Math.ceil(timeLeft));
    const livEl = document.getElementById("hLives");
    if (livEl) {
        livEl.textContent = "❤️".repeat(lives) + "🖤".repeat(Math.max(0, 3-lives));
        livEl.className = "hud-val lives-val" + (lives <= 1 ? " lives-danger" : "");
    }
}
function updateStreakDisplay() {
    const el = document.getElementById("streakDisplay");
    if (!el) return;
    const last8 = streakHistory.slice(-8);
    el.innerHTML = last8.map(v =>
        `<div class="streak-dot ${v === 'swish' ? 'swish' : v ? 'hit' : 'miss'}"></div>`
    ).join("");
}
function updatePauseButton() {
    const btn = document.getElementById("pauseBtn");
    if (btn) btn.textContent = paused ? "REPRENDRE" : "PAUSE";
}

// ── Input ───────────────────────────────────────────────────────
let activePointerId = null;

function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (W / rect.width),
        y: (clientY - rect.top)  * (H / rect.height)
    };
}

function updateAimFromClientPoint(clientX, clientY) {
    const p = getCanvasCoords(clientX, clientY);
    mouseX = p.x;
    mouseY = p.y;
}

function canShoot() {
    return gameRunning && !paused && !timeUp && !ball.isMoving && !ball.resolved;
}

function launchVelocity(tx, ty) {
    const dx  = tx - ball.x;
    const dy  = ty - ball.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 4) return null;
    const power = Math.min(mag * POWER_K, MAX_POWER);
    return { vx: (dx / mag) * power, vy: (dy / mag) * power, mag };
}

function shootTowardClientPoint(clientX, clientY) {
    if (!canShoot()) return;

    const p = getCanvasCoords(clientX, clientY);
    const v = launchVelocity(p.x, p.y);
    if (!v) return;

    ball.vx = v.vx;
    ball.vy = v.vy;
    ball.spin = ball.vx * 0.14 + (Math.random()-.5) * 0.05;
    ball.startX = ball.x;
    ball.startY = ball.y;
    ball.shotPts = zonePoints(ball.x, ball.y);
    ball.isMoving = true;
    ball.rimHits  = 0;
    ball.flightTime = 0;
    aiming        = false;
    shotsTaken++;

    if (selectedMode === "precision") {
        precisionShotsLeft = Math.max(0, precisionShotsLeft - 1);
    }

    updateHUD();
    try { getAudio(); } catch(e) {}
}

if (window.PointerEvent) {
    canvas.addEventListener("pointerdown", e => {
        if (paused) { togglePause(); e.preventDefault(); return; }
        if (!canShoot()) return;
        activePointerId = e.pointerId;
        updateAimFromClientPoint(e.clientX, e.clientY);
        aiming = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
    });

    canvas.addEventListener("pointermove", e => {
        if (e.pointerType === "mouse" || activePointerId === e.pointerId) {
            updateAimFromClientPoint(e.clientX, e.clientY);
            if (canShoot()) aiming = true;
        }
    });

    canvas.addEventListener("pointerup", e => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        shootTowardClientPoint(e.clientX, e.clientY);
        activePointerId = null;
        aiming = false;
        e.preventDefault();
    });

    canvas.addEventListener("pointercancel", () => {
        activePointerId = null;
        aiming = false;
    });

    canvas.addEventListener("pointerleave", e => {
        if (e.pointerType === "mouse") aiming = false;
    });
} else {
    canvas.addEventListener("mousemove", e => {
        updateAimFromClientPoint(e.clientX, e.clientY);
        if (canShoot()) aiming = true;
    });
    canvas.addEventListener("mouseleave", () => { aiming = false; });
    canvas.addEventListener("click", e => {
        if (paused) { togglePause(); return; }
        shootTowardClientPoint(e.clientX, e.clientY);
    });
}

document.addEventListener("keydown", e => {
    if (!gameStarted) return;
    const k = e.key.toLowerCase();
    if (k === "p" || k === "escape") { togglePause(); e.preventDefault(); }
    else if (k === "r") restartGame();
    else if (k === "m") toggleMute();
    else if (selectedMode === "defense" && (k === "1" || k === "2")) setDefenderHands(Number(k));
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden && gameStarted && gameRunning && !paused) togglePause();
});

function togglePause() {
    if (!gameStarted || !gameRunning) return;
    paused = !paused;
    aiming = false;
    activePointerId = null;
    lastTime = 0;
    updatePauseButton();
}

function toggleMute() {
    muted = !muted;
    const btn = document.getElementById("muteBtn");
    if (btn) btn.textContent = muted ? "🔇" : "🔊";
}

// ── Survival hoop movement ─────────────────────────────────────
function updateHoopMovement(dt) {
    if (!((selectedMode === "classic" && score >= 20) || (selectedMode === "survival" && basketsMade >= 3))) return;

    // Smooth figure-eight path; speed and amplitude grow with baskets
    const level = Math.min(selectedMode === "classic" ? Math.floor((score - 20) / 5) : basketsMade - 3, 20);
    hoopConfig.movePhase += dt * (0.012 + level * 0.0012);
    const ampX = Math.min(30 + level * 5, 70);
    const ampY = Math.min(15 + level * 3, 60);
    hoopConfig.x = BASE_HOOP.x + Math.sin(hoopConfig.movePhase) * ampX;
    hoopConfig.y = 225 + Math.sin(hoopConfig.movePhase * 2) * ampY;
    syncHoopGeometry();
}

// Defensive challenge: a moving opponent attempts a legal-looking shot contest.
function updateDefender(dt) {
    defender.cooldown = Math.max(0, defender.cooldown - dt);
    const desiredX = ball.isMoving && ball.vx > 0
        ? Math.max(hoopConfig.x - 110, Math.min(hoopConfig.x - 22, ball.x + 22))
        : hoopConfig.x - 65;
    defender.x += (desiredX - defender.x) * Math.min(1, dt * 0.065);
    defender.y = hoopConfig.y + 70;
}
function checkDefenderBlock() {
    if (!ball.isMoving || ball.scored || defender.blocked || defender.cooldown > 0 || ball.vy <= -7) return false;
    const reach = defender.handMode === 2 ? 43 : 32;
    const handY = defender.y - (defender.handMode === 2 ? 70 : 62);
    const handX = defender.x + (defender.handMode === 2 ? 3 : 12);
    if (Math.hypot(ball.x - handX, ball.y - handY) > reach) return false;
    defender.blocked = true;
    defender.cooldown = 65;
    ball.isMoving = false;
    ball.vx = 0; ball.vy = 0;
    spawnParticles(ball.x, ball.y, "#65c7ff", 15, 5);
    spawnFloatText(ball.x, ball.y - 40, "CONTRE !", "#65c7ff", 23);
    soundBounce();
    handleMiss();
    return true;
}
function drawDefender() {
    const x = defender.x, y = defender.y;
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath(); ctx.ellipse(0, 5, 18, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#263a62"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-7,-19); ctx.lineTo(-10,0);
    ctx.moveTo(7,-19); ctx.lineTo(10,0); ctx.stroke();
    ctx.fillStyle = "#d14553"; ctx.fillRect(-13,-48,26,29);
    ctx.fillStyle = "#dca47b"; ctx.beginPath(); ctx.arc(0,-57,10,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#ffdfb3"; ctx.lineWidth = 10;
    ctx.beginPath();
    if (defender.handMode === 2) {
        ctx.moveTo(-11,-43); ctx.lineTo(-17,-73);
        ctx.moveTo(11,-43); ctx.lineTo(17,-73);
    } else {
        ctx.moveTo(-11,-43); ctx.lineTo(-15,-27);
        ctx.moveTo(11,-43); ctx.lineTo(15,-72);
    }
    ctx.stroke();
    ctx.fillStyle = "#f7d586"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
    ctx.fillText(defender.handMode === 2 ? "2 MAINS" : "1 MAIN",0,25);
    ctx.restore();
}

// ── Game loop ───────────────────────────────────────────────────
let animId = null;
function gameLoop(timestamp) {
    if (!gameStarted) return;
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 16.666, 3);
    lastTime = timestamp;
    if (!paused) update(dt);
    draw();
    animId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    crowdHype = Math.max(0, crowdHype - 0.012 * dt);
    hoopConfig.netPhase += dt * 0.1;
    hoopConfig.netStretch = Math.max(0, hoopConfig.netStretch - 0.05 * dt);
    updateParticles(dt);
    updateFloatTexts(dt);
    if (shakeTimer > 0) shakeTimer -= dt;
    if (flashTimer > 0) flashTimer -= dt;

    if (!gameRunning) return;

    updateClock(dt);
    updateHoopMovement(dt);
    if (selectedMode === "defense") updateDefender(dt);

    if (ball.isMoving) {
        ball.flightTime += dt;

        ball.vy += GRAVITY * dt;
        ball.vx += wind * dt;
        ball.x  += ball.vx * dt;
        ball.y  += ball.vy * dt;

        ball.spin += (ball.vx * 0.005 - ball.spin) * 0.08 * dt;
        ball.angle += ball.spin * dt;

        ball.vx *= Math.pow(0.998, dt);
        ball.vy *= Math.pow(0.9998, dt);

        // Wall bounces
        if (ball.x - ball.radius < 0) {
            ball.x  = ball.radius;
            ball.vx = Math.abs(ball.vx) * 0.65;
            ball.spin = -ball.spin * 0.7;
            soundBounce();
        }
        if (ball.x + ball.radius > W) {
            ball.x  = W - ball.radius;
            ball.vx = -Math.abs(ball.vx) * 0.65;
            ball.spin = -ball.spin * 0.7;
            soundBounce();
        }

        // Ball left the screen (or got stuck): the shot is over
        if (ball.y - ball.radius > H || ball.flightTime > SHOT_TIMEOUT) {
            ball.isMoving = false;
            if (ball.scored) finishScoredShot();
            else handleMiss();
            return;
        }

        if (!ball.scored) {
            if (selectedMode === "defense" && checkDefenderBlock()) return;
            collideBackboard();
            checkRimCollision(hoopConfig.rimLeft,  hoopConfig.y);
            checkRimCollision(hoopConfig.rimRight, hoopConfig.y);
            resolveRightRimBackboardTrap();

            if (ball.y + ball.radius < hoopConfig.y) ball.passedAboveHoop = true;

            const margin = 6;
            if (
                ball.passedAboveHoop &&
                ball.y > hoopConfig.y && ball.y < hoopConfig.y + 35 &&
                ball.x > hoopConfig.rimLeft  + margin &&
                ball.x < hoopConfig.rimRight - margin &&
                ball.vy > 0
            ) {
                handleScore();
            }
        } else {
            // Through the net: slow down and centre on the hoop
            const inNet = ball.y < hoopConfig.y + 60;
            if (inNet) {
                ball.vx += (hoopConfig.x - ball.x) * 0.08 * dt;
                ball.vx *= Math.pow(0.8, dt);
                ball.vy  = Math.min(ball.vy, 4.5);
            }
        }

        updateBallTrail(dt);
    } else {
        updateBallTrail(dt);
    }
}

function updateClock(dt) {
    if ((selectedMode !== "timer" && selectedMode !== "defense") || timeUp) return;
    timeLeft -= dt / 60;
    const sec = Math.ceil(timeLeft);
    if (sec !== lastTickSecond) {
        lastTickSecond = sec;
        updateHUD();
        if (sec <= 5 && sec > 0) {
            document.getElementById("hTimer").classList.add("timer-low");
            soundTick();
        }
    }
    if (timeLeft <= 0) {
        timeLeft = 0;
        timeUp = true;
        aiming = false;
        soundBuzzer();
        updateHUD();
        if (ball.isMoving && !ball.scored) {
            setMsg("⏰ BUZZER ! Le ballon est encore en l'air...");
            spawnFloatText(W/2, 110, "BUZZER !", "#ffd60a", 30);
        } else if (!ball.isMoving) {
            schedule(endGame, 500);
        }
    }
}

function collideBackboard() {
    const bb = hoopConfig.backboard;
    if (
        ball.x + ball.radius > bb.x &&
        ball.x - ball.radius < bb.x + bb.w &&
        ball.y + ball.radius > bb.y &&
        ball.y - ball.radius < bb.y + bb.h
    ) {
        if (ball.vx > 0 && ball.x < bb.x + bb.w / 2) {
            // Front face
            ball.vx = -Math.abs(ball.vx) * 0.55;
            ball.x  = bb.x - ball.radius - 0.5;
            ball.spin = ball.vy * 0.1;
            ball.vy  *= 0.8;
        } else if (ball.y < bb.y + 10 && ball.vy > 0) {
            // Top edge
            ball.vy = -Math.abs(ball.vy) * 0.5;
            ball.y  = bb.y - ball.radius - 0.5;
        } else if (ball.y > bb.y + bb.h - 10 && ball.vy < 0) {
            // Bottom edge
            ball.vy = Math.abs(ball.vy) * 0.5;
            ball.y  = bb.y + bb.h + ball.radius + 0.5;
        } else {
            return;
        }
        ball.rimHits++;
        spawnParticles(ball.x, ball.y, "#aaa", 6, 3);
        soundBackboard();
    }
}

function checkRimCollision(rimX, rimY) {
    const dx   = ball.x - rimX;
    const dy   = ball.y - rimY;
    const dist = Math.hypot(dx, dy);
    const minD = ball.radius + hoopConfig.rimRadius;
    if (dist < minD && dist > 0.1) {
        const nx = dx / dist;
        const ny = dy / dist;

        ball.x = rimX + nx * minD;
        ball.y = rimY + ny * minD;

        const dot = ball.vx * nx + ball.vy * ny;
        if (dot >= 0) return; // already moving away
        ball.vx = (ball.vx - 2 * dot * nx) * 0.55;
        ball.vy = (ball.vy - 2 * dot * ny) * 0.55;

        const tx = -ny, ty = nx;
        const relT = ball.vx * tx + ball.vy * ty;
        ball.spin = ball.spin * 0.6 + relT * 0.04;

        ball.rimHits++;
        soundBounce();
        spawnParticles(ball.x, ball.y, "#e05c00", 5, 3);
    }
}

// Prevents rare pocket lock between right rim and backboard.
function resolveRightRimBackboardTrap() {
    const bb = hoopConfig.backboard;
    const pocketLeft  = hoopConfig.rimRight + hoopConfig.rimRadius;
    const pocketRight = bb.x - ball.radius;
    const inPocketX   = ball.x > pocketLeft && ball.x < pocketRight + 1;
    const nearRimY    = Math.abs(ball.y - hoopConfig.y) < ball.radius + hoopConfig.rimRadius + 2;
    const speed       = Math.hypot(ball.vx, ball.vy);

    if (inPocketX && nearRimY && speed < 2.6) {
        ball.x = hoopConfig.rimRight - (ball.radius + hoopConfig.rimRadius + 1);
        ball.y = Math.min(ball.y, hoopConfig.y - (ball.radius + hoopConfig.rimRadius + 1));
        ball.vx = -Math.max(2.2, Math.abs(ball.vx) + 1.1);
        ball.vy = -Math.max(2.4, Math.abs(ball.vy) + 0.8);
        ball.spin *= 0.6;
        ball.rimHits++;
        soundBounce();
        spawnParticles(ball.x, ball.y, "#ffb347", 6, 2.5);
    }
}

function handleScore() {
    ball.scored = true;
    ball.resolved = true;

    const isSwish = ball.rimHits === 0;
    const pts = ball.shotPts || zonePoints(ball.startX, ball.startY);
    const buzzer = timeUp && selectedMode === "timer";

    let totalPts = pts * combo;
    let label    = pts === 3 ? "🔥 3 PTS !" : pts === 2 ? "2 PTS" : "1 PT";

    if (isSwish) {
        totalPts = Math.round(totalPts * 1.5);
        label = "🌟 SWISH ! " + label;
        swishCount++;
        spawnSwishTrail(ball.x, hoopConfig.y);
        spawnFloatText(ball.x, hoopConfig.y - 55, "SWISH !", "#00e5ff", 26);
    }
    if (buzzer) {
        totalPts *= 2;
        spawnFloatText(W/2, 150, "🚨 BUZZER BEATER x2 !", "#ffd60a", 34);
        spawnConfetti(60);
    }

    // Classic encourages bank shots and rim rebounds without penalizing swishes.
    if (selectedMode === "classic" && ball.rimHits > 0) {
        const reboundBonus = Math.min(3, ball.rimHits);
        totalPts += reboundBonus;
        spawnFloatText(ball.x, hoopConfig.y - 80, "REBOND +" + reboundBonus, "#f7d36a", 20);
    }
    score      += totalPts;
    basketsMade++;
    if (pts === 3) threesMade++;
    combo       = Math.min(combo + 1, 10);
    maxCombo    = Math.max(maxCombo, combo);
    hoopConfig.netStretch = 1;
    crowdHype   = Math.min(1, crowdHype + (pts === 3 ? .9 : .6) + (isSwish ? .3 : 0));

    // Classic: time bonus
    if (selectedMode === "timer" && !timeUp) {
        const bonus = (isSwish ? 2 : 0) + (pts === 3 ? 1 : 0);
        if (bonus > 0) {
            timeLeft += bonus;
            spawnFloatText(W/2, 70, `+${bonus} s`, "#7CFC00", 24);
            bump("hTimer");
            if (timeLeft > 5) document.getElementById("hTimer").classList.remove("timer-low");
        }
    }

    soundScore(pts, isSwish);
    soundCombo(combo);

    spawnParticles(ball.x, hoopConfig.y, "#FF8C00", 20, 7);
    spawnParticles(ball.x, hoopConfig.y, "#fff",     8, 4);
    spawnStars(ball.x, hoopConfig.y, 6);
    spawnRipple(ball.x, hoopConfig.y);
    if (combo >= 3) spawnFlames(ball.x, hoopConfig.y - 10, 12);
    if (combo === 5 || combo === 10) spawnConfetti(30);

    spawnFloatText(ball.x, hoopConfig.y - 30, `${label}  +${totalPts}`, "#FF8C00");
    if (combo > 2) spawnFloatText(ball.x, hoopConfig.y - 65, `COMBO x${combo} !`, "#ff4400", 26);
    if (combo === 5) spawnFloatText(W/2, 120, "🔥 ON FIRE !", "#ff4400", 32);

    streakHistory.push(isSwish ? "swish" : true);
    setMsg(buzzer ? `🚨 BUZZER BEATER ! +${totalPts} pts`
        : isSwish ? `🌟 SWISH ! +${totalPts} pts`
        : combo > 3 ? `🔥 COMBO x${combo} ! +${totalPts} pts`
        : `PANIER ! +${totalPts} pts`);

    flashTimer = 18;
    flashColor = isSwish ? "rgba(0,229,255,0.15)" : "rgba(255,140,0,0.18)";
    shakeTimer  = combo >= 3 ? 10 : 6;
    shakeAmount = combo >= 5 ? 4 : 2.5;

    bump("hScore"); bump("hCombo");
    updateHUD();
    updateStreakDisplay();

    // Ball keeps falling through the net; next ball once it is out
    schedule(() => { if (ball.scored && ball.isMoving) { ball.isMoving = false; finishScoredShot(); } }, 900);
}

function finishScoredShot() {
    if (isGameDone()) { schedule(endGame, 400); return; }
    schedule(() => { resetBall(); aiming = false; }, 150);
}

function isGameDone() {
    if (selectedMode === "precision") return precisionShotsLeft <= 0;
    if (selectedMode === "timer" || selectedMode === "defense") return timeUp;
    if (selectedMode === "classic") return false;
    return lives <= 0;
}

function handleMiss() {
    ball.isMoving = false;
    ball.resolved = true;
    combo = 1;
    soundMiss();

    spawnParticles(Math.min(W - 20, Math.max(20, ball.x)), Math.min(H - 10, ball.y), "#e63946", 10, 4);
    spawnFloatText(ball.x, Math.min(H - 30, ball.y - 20), "RATÉ", "#e63946", 24);
    streakHistory.push(false);
    shakeTimer  = 5;
    shakeAmount = 2;

    if (selectedMode === "survival") {
        lives = Math.max(0, lives - 1);
        soundLifeLost();
        spawnFloatText(W/2, 80, lives > 0 ? `❤️ ${lives} vie${lives>1?'s':''} restante${lives>1?'s':''}` : "💀 GAME OVER !", "#e63946", 20);
    }

    const msgMap = {
        survival: `💀 Raté ! ${lives} vie${lives>1?'s':''} restante${lives>1?'s':''}`,
        precision: `Raté ! ${precisionShotsLeft} tir${precisionShotsLeft>1?'s':''} restant${precisionShotsLeft>1?'s':''}`,
        classic: "Continue ! Tu peux battre ton record.",
        timer: timeUp ? "⏰ Temps écoulé !" : "Raté ! Réessaie...",
        defense: timeUp ? "⏰ Temps écoulé !" : "Défenseur en place — retente ton tir !"
    };
    setMsg(msgMap[selectedMode] || "Raté !");
    updateHUD();
    updateStreakDisplay();

    if (isGameDone()) { schedule(endGame, 700); return; }
    schedule(() => { resetBall(); aiming = false; }, 400);
}

// ── Draw ─────────────────────────────────────────────────────────
function draw() {
    ctx.save();

    if (shakeTimer > 0 && !paused) {
        const s = (shakeTimer / 10) * shakeAmount;
        ctx.translate((Math.random()-.5)*s*2, (Math.random()-.5)*s*2);
    }

    drawCourt();
    drawCrowd();
    drawSpotMarker();
    drawPlayerHands();
    drawAimLine();
    drawHoopBack();
    if (selectedMode === "defense") drawDefender();
    drawBallTrail();
    drawBall();
    drawHoopFront();
    drawParticles();
    drawFloatTexts();
    drawWindIndicator();

    if (flashTimer > 0) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashTimer / 18;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    if (selectedMode === "precision" && precisionShotsLeft <= 3 && precisionShotsLeft > 0 && !ball.isMoving) {
        ctx.fillStyle = "rgba(255,140,0,.08)";
        ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();

    if (paused) drawPauseOverlay();
}

function drawPauseOverlay() {
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FF8C00";
    ctx.font = "bold 54px 'Oswald', Arial";
    ctx.fillText("PAUSE", W/2, H/2 - 10);
    ctx.fillStyle = "#ccc";
    ctx.font = "600 18px 'Rajdhani', Arial";
    ctx.fillText("Clique ou appuie sur P pour reprendre", W/2, H/2 + 26);
}

function drawBallTrail() {
    if (ballTrail.length < 2) return;
    const col = combo >= 5 ? "#ff4400" : "#FF8C00";
    for (let i = 0; i < ballTrail.length; i++) {
        const t   = ballTrail[i];
        const r   = ball.radius * t.life * .7;
        if (r <= 0) continue;
        ctx.globalAlpha = t.life * .5;
        const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
        grad.addColorStop(0, col);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Static court background is rendered once to an offscreen canvas
function buildCourtCache() {
    const c = document.createElement("canvas");
    const dpr = canvas.width / W;
    c.width = canvas.width; c.height = canvas.height;
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wallGrad = g.createLinearGradient(0, 0, 0, FLOOR_Y);
    wallGrad.addColorStop(0, "#0b0400");
    wallGrad.addColorStop(1, "#1c0900");
    g.fillStyle = wallGrad;
    g.fillRect(0, 0, W, FLOOR_Y);

    // Arena spotlights
    [[160, .05], [410, .07], [660, .06]].forEach(([x, a]) => {
        const lg = g.createRadialGradient(x, -20, 0, x, -20, 260);
        lg.addColorStop(0, `rgba(255,200,120,${a * 2})`);
        lg.addColorStop(1, "transparent");
        g.fillStyle = lg;
        g.fillRect(0, 0, W, FLOOR_Y);
    });

    g.strokeStyle = "rgba(255,140,0,.04)";
    g.lineWidth   = 1;
    for (let x = 0; x < W; x += 80) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, FLOOR_Y); g.stroke();
    }

    // Floor
    const floorGrad = g.createLinearGradient(0, FLOOR_Y, 0, H);
    floorGrad.addColorStop(0, "#7a3812");
    floorGrad.addColorStop(1, "#4a1e05");
    g.fillStyle = floorGrad;
    g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    g.strokeStyle = "rgba(0,0,0,.25)";
    g.lineWidth   = 1.5;
    for (let x = 0; x < W; x += 40) {
        g.beginPath(); g.moveTo(x, FLOOR_Y); g.lineTo(x, H); g.stroke();
    }
    g.strokeStyle = "rgba(255,160,60,.06)";
    g.lineWidth   = 1;
    for (let x = 20; x < W; x += 40) {
        g.beginPath(); g.moveTo(x, FLOOR_Y); g.lineTo(x, H); g.stroke();
    }
    // Floor reflection of the lights
    g.fillStyle = "rgba(255,220,160,.05)";
    g.beginPath(); g.ellipse(W/2, FLOOR_Y + 40, 320, 30, 0, 0, Math.PI*2); g.fill();

    g.strokeStyle = "rgba(255,255,255,.45)";
    g.lineWidth   = 3;
    g.beginPath(); g.moveTo(0, FLOOR_Y); g.lineTo(W, FLOOR_Y); g.stroke();

    courtCache = c;
}

function drawCourt() {
    if (!courtCache) buildCourtCache();
    ctx.drawImage(courtCache, 0, 0, W, H);

    // Zone arcs follow the hoop (it moves in survival)
    const hx = hoopConfig.x;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, FLOOR_Y, W, H - FLOOR_Y); ctx.clip();
    ctx.fillStyle = "rgba(255,140,0,.05)";
    ctx.beginPath(); ctx.arc(hx, H, ZONE_2PT, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "rgba(255,140,0,.35)";
    ctx.lineWidth   = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(hx, H, ZONE_3PT, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, H, ZONE_2PT, Math.PI, 0); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = "rgba(255,140,0,.45)";
    ctx.font      = "bold 12px 'Oswald', Arial";
    ctx.textAlign = "center";
    const labelY = H - 10;
    ctx.fillText("3 PTS", Math.max(30, hx - ZONE_3PT - 50), labelY);
    ctx.fillText("2 PTS", hx - (ZONE_2PT + ZONE_3PT) / 2, labelY);
    ctx.fillText("1 PT",  hx - ZONE_2PT / 2, labelY);
}

function drawCrowd() {
    const crowdY = FLOOR_Y - 8;
    const t = performance.now() * 0.012;
    ctx.fillStyle = `rgba(255,60,0,${.06 + crowdHype * .12})`;
    ctx.fillRect(0, crowdY - 55, W, 55);

    ctx.fillStyle = "rgba(0,0,0,.72)";
    for (let x = 10; x < W; x += 26) {
        const jump = crowdHype > 0.05 ? Math.max(0, Math.sin(t + x * 0.9)) * 9 * crowdHype : 0;
        const h = 16 + Math.sin(x * 0.28) * 5 + Math.sin(x * 0.07) * 4 + jump;
        ctx.beginPath();
        ctx.arc(x, crowdY - h, 8 + Math.sin(x * 0.5) * 2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillRect(x - 6, crowdY - h, 12, h);
        // Raised arms when the crowd is hyped
        if (crowdHype > 0.4 && (x / 26) % 3 < 1) {
            ctx.fillRect(x - 9, crowdY - h - 14, 3, 12);
            ctx.fillRect(x + 6, crowdY - h - 14, 3, 12);
        }
    }
}

// Visible shooter hands follow the ball before release, with a shooting gesture.
function drawPlayerHands() {
    if (!ball || !gameRunning) return;
    const x = ball.isMoving ? ball.startX : ball.x;
    const y = ball.isMoving ? ball.startY : ball.y;
    const fade = ball.isMoving ? Math.max(0, 1 - ball.flightTime / 12) : 1;
    if (fade <= 0) return;
    ctx.save(); ctx.globalAlpha = fade;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#d8a178"; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(x - 34, y + 66); ctx.lineTo(x - 19, y + 25);
    ctx.moveTo(x + 34, y + 66); ctx.lineTo(x + 19, y + 25); ctx.stroke();
    ctx.fillStyle = "#e9b58b";
    for (let side of [-1,1]) {
        ctx.save(); ctx.translate(x + side * 17, y + 16);
        ctx.rotate(side * -0.28);
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}

function drawSpotMarker() {
    if (ball.isMoving || ball.resolved || !gameRunning) return;
    const pts = zonePoints(ball.x, ball.y);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + ball.radius + 2, 22, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = pts === 3 ? "#ffd60a" : pts === 2 ? "#FF8C00" : "#ccc";
    ctx.font = "bold 13px 'Oswald', Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${pts} PT${pts > 1 ? "S" : ""}`, ball.x, ball.y - ball.radius - 10);
}

function drawWindIndicator() {
    if (!wind) return;
    const x = W/2, y = 34;
    const strength = Math.abs(wind) / 0.03;
    const dir = Math.sign(wind);
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(x - 70, y - 18, 140, 30);
    ctx.fillStyle = "#9fdcff";
    ctx.font = "bold 12px 'Oswald', Arial";
    ctx.textAlign = "center";
    ctx.fillText("VENT", x, y - 4);
    const len = 20 + strength * 40;
    ctx.strokeStyle = "#9fdcff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - dir * len/2, y + 4);
    ctx.lineTo(x + dir * len/2, y + 4);
    ctx.lineTo(x + dir * (len/2 - 6), y);
    ctx.moveTo(x + dir * len/2, y + 4);
    ctx.lineTo(x + dir * (len/2 - 6), y + 8);
    ctx.stroke();
}

function drawAimLine() {
    if (!aiming || !canShoot()) return;
    const v = launchVelocity(mouseX, mouseY);
    if (!v) return;
    let { vx, vy } = v;

    // Trajectory preview uses the same per-frame physics as the ball
    let px = ball.x, py = ball.y;
    for (let i = 0; i < 30; i++) {
        vy += GRAVITY; vx += wind;
        px += vx; py += vy;
        vx *= 0.998; vy *= 0.9998;
        if (py > H || px < 0 || px > W) break;
        if (i % 2) continue;
        const alpha = 0.6 - i * 0.018;
        const size  = 3.5 - i * 0.08;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle   = "#FF8C00";
        ctx.beginPath(); ctx.arc(px, py, Math.max(.5,size), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Power gauge next to the ball
    const pct = Math.min(v.mag * POWER_K / MAX_POWER, 1);
    const gx = ball.x - 34, gy = ball.y - 30, gh = 60;
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(gx, gy, 8, gh);
    ctx.fillStyle = pct > .9 ? "#e63946" : pct > .6 ? "#FF8C00" : "#ffd60a";
    ctx.fillRect(gx, gy + gh * (1 - pct), 8, gh * pct);
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, 8, gh);
}

// Back part of the hoop: pole, backboard, arm, net (drawn behind the ball)
function drawHoopBack() {
    const hy  = hoopConfig.y;
    const bb  = hoopConfig.backboard;

    ctx.strokeStyle = "#666";
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.moveTo(bb.x + bb.w/2, bb.y + bb.h);
    ctx.lineTo(bb.x + bb.w/2, FLOOR_Y);
    ctx.stroke();

    ctx.fillStyle = "rgba(180,220,255,.12)";
    ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
    ctx.strokeStyle = "#9ab";
    ctx.lineWidth   = 3;
    ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);

    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth   = 2;
    ctx.strokeRect(bb.x - 2, hy - 16, bb.w + 2, 42);

    ctx.strokeStyle = "#888";
    ctx.lineWidth   = 4;
    ctx.beginPath();
    ctx.moveTo(bb.x + bb.w/2, hy);
    ctx.lineTo(hoopConfig.rimRight, hy);
    ctx.stroke();
}

// Front part: net and rim, drawn over the ball so it goes "through"
function drawHoopFront() {
    const hx  = hoopConfig.x;
    const hy  = hoopConfig.y;
    const rl  = hoopConfig.rimLeft;
    const rr  = hoopConfig.rimRight;

    drawAnimatedNet(rl, rr, hy);

    const distToHoop = Math.hypot(ball.x - hx, ball.y - hy);
    if (distToHoop < 120 && ball.isMoving) {
        ctx.shadowColor = "#FF8C00";
        ctx.shadowBlur  = 12;
    }

    ctx.strokeStyle = "#e05c00";
    ctx.lineWidth   = 4;
    ctx.beginPath(); ctx.moveTo(rl, hy); ctx.lineTo(rr, hy); ctx.stroke();

    ctx.fillStyle   = "#e05c00";
    ctx.strokeStyle = "#c04400";
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.arc(rl, hy, hoopConfig.rimRadius, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(rr, hy, hoopConfig.rimRadius, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    ctx.shadowBlur  = 0;
    ctx.shadowColor = "transparent";

    if (selectedMode === "survival" && basketsMade >= 3 && gameRunning) {
        const blink = Math.sin(performance.now() * 0.008) > 0;
        if (blink) {
            ctx.strokeStyle = "rgba(255,60,0,.5)";
            ctx.lineWidth   = 2;
            ctx.setLineDash([5,4]);
            ctx.beginPath(); ctx.arc(hx, hy + 10, 50, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function drawAnimatedNet(rl, rr, hy) {
    const stretch  = hoopConfig.netStretch;
    const netDepth = 55 + stretch * 18;
    const narrow   = 1 - stretch * .35;
    const segments = 8;
    const phase    = hoopConfig.netPhase;
    const swayAmp  = 3 + stretch * 4;

    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth   = 1.5;

    for (let i = 0; i <= segments; i++) {
        const t   = i / segments;
        const nx  = rl + (rr - rl) * t;
        const cx  = hoopConfig.x;
        const sway = Math.sin(phase + t * Math.PI * 2) * swayAmp;
        const midX = nx + (cx - nx) * 0.5 + sway;
        const midY = hy + netDepth * 0.5;
        ctx.beginPath();
        ctx.moveTo(nx, hy);
        ctx.quadraticCurveTo(midX, midY, cx + (t - .5) * 20 * narrow + sway*.5, hy + netDepth);
        ctx.stroke();
    }
    for (let row = 1; row <= 3; row++) {
        const rowY   = hy + netDepth * (row / 4);
        const interp = row / 4;
        const hw     = (rr - rl) * (1 - interp * .7) * narrow / 2;
        ctx.beginPath();
        ctx.moveTo(hoopConfig.x - hw, rowY);
        ctx.lineTo(hoopConfig.x + hw, rowY);
        ctx.stroke();
    }
}

function drawBall() {
    if (ball.y - ball.radius > H + 20) return;

    // Floor shadow
    if (ball.y < FLOOR_Y + 40) {
        const dist  = Math.max(0, FLOOR_Y - ball.y);
        const scale = Math.max(.15, 1 - dist / (H * 0.5));
        ctx.fillStyle = `rgba(0,0,0,${scale * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(ball.x, Math.max(FLOOR_Y + 6, ball.y + ball.radius), ball.radius * 1.3 * scale, ball.radius * .4 * scale, 0, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.save();
    ctx.translate(ball.x, ball.y);

    // Combo fire glow
    if (combo >= 4 && ball.isMoving) {
        const r = ball.radius + 10;
        const fg = ctx.createRadialGradient(0,0,ball.radius*.8, 0,0,r);
        fg.addColorStop(0, "rgba(255,100,0,.6)");
        fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
    }

    ctx.rotate(ball.angle);

    const grad = ctx.createRadialGradient(-5, -6, 2, 0, 0, ball.radius);
    grad.addColorStop(0,   "#ffaa44");
    grad.addColorStop(0.5, "#e06000");
    grad.addColorStop(1,   "#8B2500");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(-ball.radius, 0); ctx.lineTo(ball.radius, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -ball.radius); ctx.lineTo(0, ball.radius); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, ball.radius * .68, Math.PI*.15, Math.PI*.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, ball.radius * .68, Math.PI*1.15, Math.PI*1.85); ctx.stroke();

    ctx.restore();

    // Fixed highlight (doesn't rotate with the ball)
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.beginPath();
    ctx.ellipse(ball.x - 5, ball.y - 6, ball.radius * .38, ball.radius * .22, -0.5, 0, Math.PI*2);
    ctx.fill();
}

// ── Game flow ─────────────────────────────────────────────────────
function endGame() {
    if (!gameRunning) return;
    gameRunning = false;
    paused = false;
    clearScheduled();

    const hs    = getScores(selectedMode)[0] || 0;
    const isNew = score > hs;
    if (score > 0) {
        saveScore(score, selectedMode);
        if (typeof window.submitGameScore === "function") window.submitGameScore(16, score);
    }
    if (isNew && score > 0) spawnConfetti(70);

    const accuracy = shotsTaken > 0 ? Math.round((basketsMade / shotsTaken) * 100) : 0;
    const titleMap = { classic: "BUZZER BEATER !", precision: "FIN DE SÉRIE !", survival: "GAME OVER !" };

    document.getElementById("goTitle").textContent     = titleMap[selectedMode] || "GAME OVER !";
    document.getElementById("goScore").textContent     = score;
    document.getElementById("goBaskets").textContent   = basketsMade;
    document.getElementById("goShots").textContent     = shotsTaken;
    document.getElementById("goAccuracy").textContent  = accuracy + "%";
    document.getElementById("goCombo").textContent     = "x" + maxCombo;
    document.getElementById("goSwish").textContent     = swishCount;
    document.getElementById("goThrees").textContent    = threesMade;
    document.getElementById("goHs").textContent        = Math.max(hs, score);
    document.getElementById("goMode").textContent      = MODE_LABELS[selectedMode];
    document.getElementById("goNewRecord").classList.toggle("hidden", !isNew);

    document.getElementById("gameOverScreen").classList.remove("hidden");
}

function startGame() {
    gameStarted = true;
    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("gameScreen").classList.remove("hidden");
    lastTime = 0;
    resetGame();
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById("gameOverScreen").classList.add("hidden");
    if (!gameStarted) { startGame(); return; }
    lastTime = 0;
    resetGame();
}

function goMenu() {
    gameStarted = false;
    gameRunning = false;
    paused = false;
    clearScheduled();
    cancelAnimationFrame(animId);
    document.getElementById("gameScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("titleScreen").style.display = "flex";
    renderTitleScores();
}

function showHowTo() { document.getElementById("howToScreen").classList.remove("hidden"); }
function hideHowTo() { document.getElementById("howToScreen").classList.add("hidden"); }

// ── Init ─────────────────────────────────────────────────────────
setupCanvasResolution();
resetHoop();
renderTitleScores();
