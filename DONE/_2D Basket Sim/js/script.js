// ══════════════════════════════════════════════════════════════
//  2D BASKET SIM — script.js  (v2 — Enhanced)
//  • Physics: realistic spin, multi-bounce, backboard angles
//  • Modes: Classic | Precision (10 shots) | Survival (lives + moving hoop)
//  • Visuals: flame trail, animated net, flash on score, screen shake++
// ══════════════════════════════════════════════════════════════

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 820;
canvas.height = 520;

const W = canvas.width;
const H = canvas.height;

// ── Audio ──────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function playTone(freq, dur = 0.1, type = "sine", vol = 0.35, delay = 0) {
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
        // Clean whoosh for swish
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
function soundMiss()    { playTone(200,.22,"sawtooth",.25); playTone(160,.2,"sawtooth",.2,.1); }
function soundBounce()  { playTone(280 + Math.random()*60,.07,"sine",.18); }
function soundBackboard(){ playTone(180,.12,"square",.2); }
function soundCombo(n)  { playTone(440 + n*55,.09,"sine",.28); }
function soundLifeLost(){ playTone(150,.3,"sawtooth",.35); playTone(100,.4,"sawtooth",.3,.25); }

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
function updateBallTrail() {
    if (ball.isMoving && combo >= 3) {
        ballTrail.push({ x: ball.x, y: ball.y, life: 1 });
    }
    for (let i = ballTrail.length-1; i >= 0; i--) {
        ballTrail[i].life -= .08;
        if (ballTrail[i].life <= 0) ballTrail.splice(i,1);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.type !== "flame") p.vy += 0.15 * dt;
        if (p.type === "star") p.angle += p.spin * dt;
        if (p.type === "ripple") p.r += 3 * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        const a = Math.max(0, p.life);
        ctx.globalAlpha = a;
        ctx.fillStyle   = p.color;

        if (p.type === "star") {
            drawStar(ctx, p.x, p.y, 5, p.size * p.life, p.size * p.life * .4, p.angle);
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
    ctx.strokeStyle = "";
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
    floatTexts.push({ x, y, text, color, life: 1, vy: -1.8, size });
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
    ctx.strokeStyle = "";
}

// ── Highscores ─────────────────────────────────────────────────
function getScores(mode = "classic") {
    try { return JSON.parse(localStorage.getItem(`basket_scores_${mode}`)) || []; }
    catch { return []; }
}
function saveScore(s, mode = "classic") {
    const scores = getScores(mode);
    scores.push(s);
    scores.sort((a, b) => b - a);
    scores.length = Math.min(scores.length, 5);
    localStorage.setItem(`basket_scores_${mode}`, JSON.stringify(scores));
}
function renderTitleScores() {
    const el = document.getElementById("titleHsList");
    if (!el) return;
    const mode = selectedMode || "classic";
    const scores = getScores(mode);
    if (!scores.length) { el.innerHTML = '<p style="color:#555;font-size:.9em">Aucun score encore</p>'; return; }
    el.innerHTML = scores.map((s, i) =>
        `<div class="hs-row"><span>#${i+1}</span><span>${s} pts</span></div>`
    ).join("");
}

// ── Game constants ──────────────────────────────────────────────
const GRAVITY   = 0.38;
const GAME_TIME = 30;

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
        // Survival: movement
        vx: 0,
        vy: 0,
        // Net animation
        netPhase: 0
    };
    hoopConfig.rimLeft  = hoopConfig.x - hoopConfig.innerW / 2;
    hoopConfig.rimRight = hoopConfig.x + hoopConfig.innerW / 2;
    hoopConfig.backboard.x = hoopConfig.x + hoopConfig.innerW/2 + 30;
    hoopConfig.backboard.y = hoopConfig.y - 40;
}

// ── Ball spawn ──────────────────────────────────────────────────
const SPAWN_SPOTS = [
    { x: 100, y: 420 },
    { x: 180, y: 440 },
    { x: 250, y: 420 },
    { x: 80,  y: 380 },
    { x: 320, y: 430 },
];

// ── Game state ──────────────────────────────────────────────────
let ball, score, highscore, combo, maxCombo;
let shotsTaken, basketsMade, swishCount, timeLeft, timerInterval;
let gameRunning, gameStarted, lastTime;
let mouseX, mouseY, aiming;
let currentSpot, streakHistory;
let shakeTimer  = 0;
let shakeAmount = 0;
let flashTimer  = 0;
let flashColor  = "rgba(255,140,0,0)";
let selectedMode = "classic";
let lives = 3;
let precisionShotsLeft = 10;

// ── Mode selection ──────────────────────────────────────────────
function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active"));
    document.querySelector(`.mode-card[data-mode="${mode}"]`)?.classList.add("active");
    renderTitleScores();
}

// ── Reset ───────────────────────────────────────────────────────
function resetBall() {
    const spot = SPAWN_SPOTS[currentSpot % SPAWN_SPOTS.length];
    ball = {
        x: spot.x, y: spot.y,
        vx: 0, vy: 0,
        radius: 16,
        isMoving: false,
        spin: 0,          // angular velocity (rad/frame)
        angle: 0,         // visual rotation
        bounceCount: 0,
        rimHits: 0,       // count rim hits this shot (swish = 0)
        passedAboveHoop: false,
        scored: false,
        dead: false
    };
}

function resetGame() {
    score         = 0;
    combo         = 1;
    maxCombo      = 1;
    shotsTaken    = 0;
    basketsMade   = 0;
    swishCount    = 0;
    timeLeft      = GAME_TIME;
    gameRunning   = true;
    currentSpot   = 0;
    streakHistory = [];
    shakeTimer    = 0;
    shakeAmount   = 0;
    flashTimer    = 0;
    lives         = 3;
    precisionShotsLeft = 10;
    particles.length   = 0;
    floatTexts.length  = 0;
    ballTrail.length   = 0;
    highscore     = getScores(selectedMode)[0] || 0;
    aiming        = false;
    mouseX        = 0; mouseY = 0;

    resetHoop();

    // Survival: hoop starts moving after wave 2
    if (selectedMode === "survival") {
        hoopConfig.vx = 0; hoopConfig.vy = 0;
    }

    resetBall();
    updateHUD();
    setMsg(getModeStartMsg());
    updateStreakDisplay();

    // HUD tweaks per mode
    const timerCell = document.getElementById("hudTimerCell");
    const livesCell = document.getElementById("hudLivesCell");
    const shotCell  = document.getElementById("hudShotCell");
    if (selectedMode === "precision") {
        timerCell.classList.add("hidden");
        livesCell.classList.add("hidden");
        shotCell.classList.remove("hidden");
        clearInterval(timerInterval);
    } else if (selectedMode === "survival") {
        timerCell.classList.add("hidden");
        livesCell.classList.remove("hidden");
        shotCell.classList.remove("hidden");
        clearInterval(timerInterval);
    } else {
        timerCell.classList.remove("hidden");
        livesCell.classList.add("hidden");
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameRunning) return;
            timeLeft--;
            updateHUD();
            if (timeLeft <= 5) document.getElementById("hTimer").classList.add("timer-low");
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    const tag = document.getElementById("modeTag");
    if (tag) tag.textContent = { classic:"⏱ CLASSIQUE", precision:"🎯 PRÉCISION", survival:"💀 SURVIE" }[selectedMode] || "";
}

function getModeStartMsg() {
    if (selectedMode === "precision") return `🎯 ${precisionShotsLeft} tirs — vise parfait !`;
    if (selectedMode === "survival")  return "💀 3 ratés et c'est fini !";
    return "Clique pour tirer !";
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
    document.getElementById("hTimer").textContent = timeLeft;
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

// ── Mouse ───────────────────────────────────────────────────────
canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    if (!ball.isMoving && gameRunning) aiming = true;
});
canvas.addEventListener("mouseleave", () => { aiming = false; });

canvas.addEventListener("click", e => {
    if (!gameRunning || ball.isMoving) return;

    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    const dx  = mx - ball.x;
    const dy  = my - ball.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 4) return;

    const power = Math.min(mag * 0.065, 18);
    ball.vx = (dx / mag) * power;
    ball.vy = (dy / mag) * power;

    // Spin based on horizontal component — more realistic
    ball.spin = ball.vx * 0.14 + (Math.random()-.5) * 0.05;

    ball.isMoving = true;
    ball.rimHits  = 0;
    aiming        = false;
    shotsTaken++;

    if (selectedMode === "precision") {
        precisionShotsLeft = Math.max(0, precisionShotsLeft - 1);
    }

    updateHUD();
    try { getAudio(); } catch(e) {}
});

// ── Survival hoop movement ──────────────────────────────────────
function updateHoopMovement(dt) {
    if (selectedMode !== "survival") return;
    if (basketsMade < 3) return; // starts moving after 3 baskets

    const speed = 0.5 + basketsMade * 0.06;

    // Random direction changes
    if (Math.random() < .01) hoopConfig.vx = (Math.random()-.5) * speed * 2;
    if (Math.random() < .006) hoopConfig.vy = (Math.random()-.5) * speed;

    hoopConfig.x += hoopConfig.vx * dt;
    hoopConfig.y += hoopConfig.vy * dt;

    // Bounds
    const minX = 450, maxX = 720, minY = 160, maxY = 300;
    if (hoopConfig.x < minX) { hoopConfig.x = minX; hoopConfig.vx = Math.abs(hoopConfig.vx); }
    if (hoopConfig.x > maxX) { hoopConfig.x = maxX; hoopConfig.vx = -Math.abs(hoopConfig.vx); }
    if (hoopConfig.y < minY) { hoopConfig.y = minY; hoopConfig.vy = Math.abs(hoopConfig.vy); }
    if (hoopConfig.y > maxY) { hoopConfig.y = maxY; hoopConfig.vy = -Math.abs(hoopConfig.vy); }

    hoopConfig.rimLeft  = hoopConfig.x - hoopConfig.innerW / 2;
    hoopConfig.rimRight = hoopConfig.x + hoopConfig.innerW / 2;
    hoopConfig.backboard.x = hoopConfig.x + hoopConfig.innerW/2 + 30;
    hoopConfig.backboard.y = hoopConfig.y - 40;
}

// ── Game loop ───────────────────────────────────────────────────
let animId = null;
function gameLoop(timestamp) {
    if (!gameStarted) return;
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 16.666, 3);
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (!gameRunning) return;

    updateHoopMovement(dt);
    hoopConfig.netPhase += dt * 0.1;

    if (ball.isMoving) {
        // ── Physics ──────────────────────────────────────────
        ball.vy += GRAVITY * dt;
        ball.x  += ball.vx * dt;
        ball.y  += ball.vy * dt;

        // Angular velocity follows ball velocity
        ball.spin += (ball.vx * 0.005 - ball.spin) * 0.08 * dt;
        ball.angle += ball.spin * dt;

        // Air drag (very slight)
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

        // Floor — reset
        if (ball.y - ball.radius > H) {
            handleMiss(); return;
        }

        // ── Backboard collision ───────────────────────────────
        const bb = hoopConfig.backboard;
        if (
            ball.x + ball.radius > bb.x &&
            ball.x - ball.radius < bb.x + bb.w &&
            ball.y + ball.radius > bb.y &&
            ball.y - ball.radius < bb.y + bb.h
        ) {
            // Realistic: angle of incidence = angle of reflection + friction
            const nx = -1; // normal faces left
            const dot = ball.vx * nx;
            ball.vx = (ball.vx - 2 * dot * nx) * 0.55;
            ball.x  = bb.x - ball.radius;
            // Impart spin from contact
            ball.spin = ball.vy * 0.1;
            ball.vy  *= 0.8;
            ball.rimHits++;
            spawnParticles(ball.x, ball.y, "#aaa", 6, 3);
            soundBackboard();
        }

        // ── Rim collisions ────────────────────────────────────
        checkRimCollision(hoopConfig.rimLeft,  hoopConfig.y);
        checkRimCollision(hoopConfig.rimRight, hoopConfig.y);

        // ── Scoring ───────────────────────────────────────────
        const cx = ball.x, cy = ball.y;
        const margin = 6;

        if (!ball.scored) {
            if (cy + ball.radius < hoopConfig.y) ball.passedAboveHoop = true;

            if (
                ball.passedAboveHoop &&
                cy > hoopConfig.y && cy < hoopConfig.y + 35 &&
                cx > hoopConfig.rimLeft  + margin &&
                cx < hoopConfig.rimRight - margin &&
                ball.vy > 0
            ) {
                handleScore();
            }
        }

        updateBallTrail();
    }

    updateParticles(dt);
    updateFloatTexts(dt);
    if (shakeTimer  > 0) shakeTimer  -= dt;
    if (flashTimer  > 0) flashTimer  -= dt;
}

function checkRimCollision(rimX, rimY) {
    const dx   = ball.x - rimX;
    const dy   = ball.y - rimY;
    const dist = Math.hypot(dx, dy);
    const minD = ball.radius + hoopConfig.rimRadius;
    if (dist < minD && dist > 0.1) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Push out
        ball.x = rimX + nx * minD;
        ball.y = rimY + ny * minD;

        // Reflect & lose energy
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx = (ball.vx - 2 * dot * nx) * 0.52;
        ball.vy = (ball.vy - 2 * dot * ny) * 0.52;

        // Contact spin: tangential friction
        const tx = -ny, ty = nx;
        const relT = ball.vx * tx + ball.vy * ty;
        ball.spin = ball.spin * 0.6 + relT * 0.04;

        ball.rimHits++;
        soundBounce();
        spawnParticles(ball.x, ball.y, "#e05c00", 5, 3);
    }
}

function handleScore() {
    ball.scored   = true;
    ball.isMoving = false;

    const isSwish = ball.rimHits === 0;

    // Points by distance
    const distFromHoop = Math.hypot(ball.x - hoopConfig.x, SPAWN_SPOTS[0].y - H);
    const spotX = SPAWN_SPOTS[currentSpot % SPAWN_SPOTS.length].x;
    const approxDist = Math.hypot(spotX - hoopConfig.x, 200);

    let pts = 1;
    if (approxDist > 430) pts = 3;
    else if (approxDist > 280) pts = 2;

    let totalPts = pts * combo;
    let label    = pts === 3 ? "🔥 3 PTS !" : pts === 2 ? "2 PTS" : "1 PT";

    if (isSwish) {
        totalPts = Math.round(totalPts * 1.5);
        label = "🌟 SWISH ! " + label;
        swishCount++;
        spawnSwishTrail(ball.x, hoopConfig.y);
        spawnFloatText(ball.x, hoopConfig.y - 55, "SWISH !", "#00e5ff", 26);
    }

    score      += totalPts;
    basketsMade++;
    combo       = Math.min(combo + 1, 10);
    maxCombo    = Math.max(maxCombo, combo);

    soundScore(pts, isSwish);
    soundCombo(combo);

    // Particles
    spawnParticles(ball.x, hoopConfig.y, "#FF8C00", 20, 7);
    spawnParticles(ball.x, hoopConfig.y, "#fff",     8, 4);
    spawnStars(ball.x, hoopConfig.y, 6);
    spawnRipple(ball.x, hoopConfig.y);
    if (combo >= 3) spawnFlames(ball.x, hoopConfig.y - 10, 12);

    spawnFloatText(ball.x, hoopConfig.y - 30, `${label}  x${combo}`, "#FF8C00");
    if (combo > 2) spawnFloatText(ball.x, hoopConfig.y - 65, `COMBO x${combo} !`, "#ff4400", 26);

    streakHistory.push(isSwish ? "swish" : true);
    setMsg(isSwish ? `🌟 SWISH ! +${totalPts} pts` : combo > 3 ? `🔥 COMBO x${combo} ! +${totalPts} pts` : `PANIER ! +${totalPts} pts`);

    // Screen flash
    flashTimer = 18;
    flashColor = isSwish ? "rgba(0,229,255,0.15)" : "rgba(255,140,0,0.18)";
    shakeTimer  = combo >= 3 ? 10 : 6;
    shakeAmount = combo >= 5 ? 4 : 2.5;

    bump("hScore"); bump("hCombo");
    updateHUD();
    updateStreakDisplay();

    currentSpot++;

    // Precision mode end check
    if (selectedMode === "precision" && precisionShotsLeft <= 0) {
        setTimeout(() => endGame(), 600);
        return;
    }
    // Survival mode: speed up
    if (selectedMode === "survival" && basketsMade >= 3) {
        const speed = 0.5 + basketsMade * 0.06;
        if (hoopConfig.vx === 0) {
            hoopConfig.vx = (Math.random()-.5) * speed * 2;
            hoopConfig.vy = (Math.random()-.5) * speed;
        }
    }

    setTimeout(() => { resetBall(); aiming = false; }, 500);
}

function handleMiss() {
    ball.isMoving = false;
    combo = 1;
    soundMiss();

    spawnParticles(ball.x, ball.y, "#e63946", 10, 4);
    spawnFloatText(ball.x, ball.y - 20, "RATÉ", "#e63946", 24);
    streakHistory.push(false);
    shakeTimer  = 5;
    shakeAmount = 2;

    if (selectedMode === "survival") {
        lives = Math.max(0, lives - 1);
        soundLifeLost();
        spawnFloatText(W/2, 80, lives > 0 ? `❤️ ${lives} vie${lives>1?'s':''} restante${lives>1?'s':''}` : "💀 GAME OVER !", "#e63946", 20);
        if (lives <= 0) {
            updateHUD();
            setTimeout(() => endGame(), 800);
            return;
        }
    }

    const msgMap = { survival: `💀 Raté ! ${lives} vie${lives!==1?'s':''} restante${lives!==1?'s':''}`, precision: "Raté !", classic: "Raté ! Réessaie..." };
    setMsg(msgMap[selectedMode] || "Raté !");
    updateHUD();
    updateStreakDisplay();
    currentSpot++;

    if (selectedMode === "precision" && precisionShotsLeft <= 0) {
        setTimeout(() => endGame(), 600);
        return;
    }

    setTimeout(() => { resetBall(); aiming = false; }, 400);
}

// ── Draw ─────────────────────────────────────────────────────────
function draw() {
    ctx.save();

    // Screen shake
    if (shakeTimer > 0) {
        const s = (shakeTimer / 10) * shakeAmount;
        ctx.translate((Math.random()-.5)*s*2, (Math.random()-.5)*s*2);
    }

    drawCourt();
    drawAimLine();
    drawHoop();
    drawBallTrail();
    drawBall();
    drawParticles();
    drawFloatTexts();

    // Full-screen flash overlay
    if (flashTimer > 0) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashTimer / 18;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    // Precision countdown overlay
    if (selectedMode === "precision" && precisionShotsLeft <= 3 && !ball.isMoving) {
        ctx.fillStyle = "rgba(255,140,0,.12)";
        ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
}

function drawBallTrail() {
    if (ballTrail.length < 2) return;
    for (let i = 0; i < ballTrail.length; i++) {
        const t   = ballTrail[i];
        const r   = ball.radius * t.life * .7;
        const col = combo >= 5 ? "#ff4400" : "#FF8C00";
        ctx.globalAlpha = t.life * .5;
        const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
        grad.addColorStop(0, col);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawCourt() {
    // Dark background
    ctx.fillStyle = "#0e0600";
    ctx.fillRect(0, 0, W, H);

    const floorY = H * 0.72;

    // Wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, floorY);
    wallGrad.addColorStop(0, "#100500");
    wallGrad.addColorStop(1, "#1c0900");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, floorY);

    // Subtle wall panels
    ctx.strokeStyle = "rgba(255,140,0,.04)";
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, floorY); ctx.stroke();
    }

    // Floor
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, "#6e3010");
    floorGrad.addColorStop(1, "#4a1e05");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, H - floorY);

    // Wood planks
    ctx.strokeStyle = "rgba(0,0,0,.25)";
    ctx.lineWidth   = 1.5;
    for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x, H); ctx.stroke();
    }
    // Highlight planks
    ctx.strokeStyle = "rgba(255,160,60,.06)";
    ctx.lineWidth   = 1;
    for (let x = 20; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x, H); ctx.stroke();
    }

    // Floor line
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth   = 3;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();

    // Zone arcs
    const hx = hoopConfig.x;
    ctx.strokeStyle = "rgba(255,140,0,.18)";
    ctx.lineWidth   = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(hx, H, 430, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, H, 280, Math.PI, 0); ctx.stroke();
    ctx.setLineDash([]);

    // Zone labels
    ctx.fillStyle = "rgba(255,140,0,.3)";
    ctx.font      = "bold 12px 'Oswald', Arial";
    ctx.textAlign = "center";
    ctx.fillText("3 PTS", 180, floorY - 8);
    ctx.fillText("2 PTS", 380, floorY - 8);
    ctx.fillText("1 PT",  530, floorY - 8);

    // Court lighting glow
    ctx.fillStyle = "rgba(255,140,0,.04)";
    ctx.beginPath(); ctx.ellipse(W/2, H*.3, 300, 200, 0, 0, Math.PI*2); ctx.fill();

    // Crowd silhouette
    drawCrowd(floorY);
}

function drawCrowd(floorY) {
    const crowdY = floorY - 8;
    // Glow behind crowd
    ctx.fillStyle = "rgba(255,60,0,.06)";
    ctx.fillRect(0, crowdY - 50, W, 50);

    ctx.fillStyle = "rgba(0,0,0,.7)";
    for (let x = 10; x < W; x += 26) {
        const h = 16 + Math.sin(x * 0.28) * 5 + Math.sin(x * 0.07) * 4;
        ctx.beginPath();
        ctx.arc(x, crowdY - h, 8 + Math.sin(x * 0.5) * 2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillRect(x - 6, crowdY - h, 12, h);
    }
}

function drawAimLine() {
    if (!aiming || ball.isMoving || !gameRunning) return;
    const bx = ball.x, by = ball.y;
    const dx = mouseX - bx, dy = mouseY - by;
    const mag = Math.hypot(dx, dy);
    if (mag < 5) return;

    const power = Math.min(mag * 0.065, 18);
    let vx = (dx / mag) * power;
    let vy = (dy / mag) * power;

    // Trajectory dots
    let px = bx, py = by;
    for (let i = 0; i < 32; i++) {
        vx *= 0.998; vy += GRAVITY;
        px += vx;    py += vy;
        if (py > H || px < 0 || px > W) break;
        const alpha = 0.55 - i * 0.015;
        const size  = 3.5 - i * 0.08;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle   = i % 4 < 2 ? "#FF8C00" : "#ffa033";
        ctx.beginPath(); ctx.arc(px, py, Math.max(.5,size), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Power bar
    const pct = Math.min(mag / 400, 1);
    const len = Math.min(mag * 0.5, 70);
    ctx.strokeStyle = `rgba(255,${Math.round(140-pct*100)},0,0.4)`;
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (dx/mag)*len, by + (dy/mag)*len);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawHoop() {
    const hx  = hoopConfig.x;
    const hy  = hoopConfig.y;
    const bb  = hoopConfig.backboard;
    const rl  = hoopConfig.rimLeft;
    const rr  = hoopConfig.rimRight;

    // Support pole
    ctx.strokeStyle = "#666";
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.moveTo(bb.x + bb.w/2, bb.y + bb.h);
    ctx.lineTo(bb.x + bb.w/2, H * 0.72);
    ctx.stroke();

    // Backboard
    ctx.fillStyle = "rgba(180,220,255,.12)";
    ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
    ctx.strokeStyle = "#9ab";
    ctx.lineWidth   = 3;
    ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);

    // Backboard target square
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth   = 2;
    ctx.strokeRect(bb.x - 2, hy - 16, bb.w + 2, 42);

    // Support arm
    ctx.strokeStyle = "#888";
    ctx.lineWidth   = 4;
    ctx.beginPath();
    ctx.moveTo(bb.x + bb.w/2, hy);
    ctx.lineTo(bb.x - 5, hy);
    ctx.stroke();

    // Animated net
    drawAnimatedNet(rl, rr, hy);

    // Rim glow (when ball is near)
    const distToHoop = Math.hypot(ball.x - hx, ball.y - hy);
    if (distToHoop < 120 && ball.isMoving) {
        ctx.shadowColor = "#FF8C00";
        ctx.shadowBlur  = 12;
    }

    // Left rim
    ctx.fillStyle   = "#e05c00";
    ctx.strokeStyle = "#c04400";
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.arc(rl, hy, hoopConfig.rimRadius, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Right rim
    ctx.beginPath(); ctx.arc(rr, hy, hoopConfig.rimRadius, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Rim connector
    ctx.strokeStyle = "#e05c00";
    ctx.lineWidth   = 4;
    ctx.beginPath(); ctx.moveTo(rl, hy); ctx.lineTo(rr, hy); ctx.stroke();

    ctx.shadowBlur  = 0;
    ctx.shadowColor = "transparent";

    // Survival: blinking indicator
    if (selectedMode === "survival" && basketsMade >= 3) {
        const blink = Math.sin(Date.now() * 0.008) > 0;
        if (blink) {
            ctx.strokeStyle = "rgba(255,60,0,.5)";
            ctx.lineWidth   = 2;
            ctx.setLineDash([5,4]);
            ctx.beginPath(); ctx.arc(hx, hy, 50, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function drawAnimatedNet(rl, rr, hy) {
    const netDepth = 55;
    const segments = 8;
    const phase    = hoopConfig.netPhase;

    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth   = 1.5;

    for (let i = 0; i <= segments; i++) {
        const t   = i / segments;
        const nx  = rl + (rr - rl) * t;
        const cx  = hoopConfig.x;
        const sway = Math.sin(phase + t * Math.PI * 2) * 3;
        const midX = nx + (cx - nx) * 0.5 + sway;
        const midY = hy + netDepth * 0.5;
        ctx.beginPath();
        ctx.moveTo(nx, hy);
        ctx.quadraticCurveTo(midX, midY, cx + (t - .5) * 20 + sway*.5, hy + netDepth);
        ctx.stroke();
    }
    // Horizontal net rows
    for (let row = 1; row <= 3; row++) {
        const rowY   = hy + netDepth * (row / 4);
        const interp = row / 4;
        const hw     = (rr - rl) * (1 - interp * .7) / 2;
        ctx.beginPath();
        ctx.moveTo(hoopConfig.x - hw, rowY);
        ctx.lineTo(hoopConfig.x + hw, rowY);
        ctx.stroke();
    }
}

function drawBall() {
    if (ball.y - ball.radius > H + 20) return;

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle);

    // Floor shadow
    if (ball.isMoving) {
        const dist    = H * 0.72 - ball.y;
        const scale   = Math.max(.1, 1 - dist / (H * 0.5));
        ctx.fillStyle = `rgba(0,0,0,${scale * 0.28})`;
        ctx.beginPath();
        ctx.ellipse(0, H * 0.72 - ball.y + ball.radius, ball.radius * 1.3 * scale, ball.radius * .4 * scale, 0, 0, Math.PI*2);
        ctx.fill();
    }

    // Shadow on ball
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(3, 5, ball.radius * .85, ball.radius * .5, 0, 0, Math.PI*2);
    ctx.fill();

    // Ball gradient
    const grad = ctx.createRadialGradient(-5, -6, 2, 0, 0, ball.radius);
    grad.addColorStop(0,   "#ffaa44");
    grad.addColorStop(0.5, "#e06000");
    grad.addColorStop(1,   "#8B2500");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI*2); ctx.fill();

    // Lines
    ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(-ball.radius, 0); ctx.lineTo(ball.radius, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -ball.radius); ctx.lineTo(0, ball.radius); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, ball.radius * .68, Math.PI*.15, Math.PI*.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, ball.radius * .68, Math.PI*1.15, Math.PI*1.85); ctx.stroke();

    // Highlight
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.beginPath();
    ctx.ellipse(-5, -6, ball.radius * .38, ball.radius * .22, -0.5, 0, Math.PI*2);
    ctx.fill();

    // Combo fire effect around ball
    if (combo >= 4 && ball.isMoving) {
        const r = ball.radius + 4;
        const fg = ctx.createRadialGradient(0,0,ball.radius*.8, 0,0,r+6);
        fg.addColorStop(0, "rgba(255,100,0,.6)");
        fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(0, 0, r+6, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
}

// ── Game flow ─────────────────────────────────────────────────────
function endGame() {
    gameRunning = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(animId);

    const hs    = getScores(selectedMode)[0] || 0;
    const isNew = score > hs;
    if (score > 0) saveScore(score, selectedMode);

    const accuracy = shotsTaken > 0 ? Math.round((basketsMade / shotsTaken) * 100) : 0;
    const titleMap = { classic: "BUZZER BEATER !", precision: "FIN DE SÉRIE !", survival: "GAME OVER !" };

    document.getElementById("goTitle").textContent     = titleMap[selectedMode] || "GAME OVER !";
    document.getElementById("goScore").textContent     = score;
    document.getElementById("goBaskets").textContent   = basketsMade;
    document.getElementById("goShots").textContent     = shotsTaken;
    document.getElementById("goAccuracy").textContent  = accuracy + "%";
    document.getElementById("goCombo").textContent     = "x" + maxCombo;
    document.getElementById("goSwish").textContent     = swishCount;
    document.getElementById("goHs").textContent        = Math.max(hs, score);
    document.getElementById("goNewRecord").classList.toggle("hidden", !isNew);

    document.getElementById("gameOverScreen").classList.remove("hidden");
}

function startGame() {
    gameStarted = true;
    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("gameScreen").classList.remove("hidden");
    lastTime = 0;
    resetGame();
    animId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById("gameOverScreen").classList.add("hidden");
    if (!gameStarted) { startGame(); return; }
    cancelAnimationFrame(animId);
    clearInterval(timerInterval);
    lastTime = 0;
    particles.length  = 0;
    floatTexts.length = 0;
    ballTrail.length  = 0;
    resetGame();
    animId = requestAnimationFrame(gameLoop);
}

function goMenu() {
    gameStarted = false;
    gameRunning = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(animId);
    document.getElementById("gameScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("titleScreen").style.display = "flex";
    renderTitleScores();
}

function showHowTo() { document.getElementById("howToScreen").classList.remove("hidden"); }
function hideHowTo() { document.getElementById("howToScreen").classList.add("hidden"); }

// ── Init ─────────────────────────────────────────────────────────
resetHoop();
renderTitleScores();