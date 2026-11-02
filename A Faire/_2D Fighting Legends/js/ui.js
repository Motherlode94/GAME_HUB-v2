// ui.js

const GAME_WIDTH        = 960;
const GAME_HEIGHT       = 540;
const GAME_HEIGHT_LOGIC = 540;


// PLATEFORMES (declare en premier car utilise partout)
const platforms = [
    { x: 170, y: GAME_HEIGHT_LOGIC - 190, w: 170, h: 16 },
    { x: 395, y: GAME_HEIGHT_LOGIC - 245, w: 170, h: 16 },
    { x: 620, y: GAME_HEIGHT_LOGIC - 190, w: 170, h: 16 },
];


// PARTICULES
const particles = [];

function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
            x, y,
            vx:    Math.cos(angle) * speed,
            vy:    Math.sin(angle) * speed - 2,
            life:  1.0,
            size:  2 + Math.random() * 5,
            color
        });
    }
}

// Poussiere d'atterrissage
function spawnLandingDust(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * 1.2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x, y,
            vx:    Math.cos(angle) * speed,
            vy:    Math.sin(angle) * speed,
            life:  0.7,
            size:  3 + Math.random() * 4,
            color: 'rgba(200,200,200,0.6)'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.vy   += 0.2;
        p.life -= 0.045;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}


// SCREEN SHAKE
let shakeIntensity = 0;

function triggerScreenShake(intensity) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
}

function getScreenShake() {
    if (shakeIntensity <= 0) return { x: 0, y: 0 };
    const sx = (Math.random() - 0.5) * shakeIntensity * 2;
    const sy = (Math.random() - 0.5) * shakeIntensity * 2;
    shakeIntensity *= 0.75;
    if (shakeIntensity < 0.3) shakeIntensity = 0;
    return { x: sx, y: sy };
}


// HIT FLASH
let hitFlash = 0;

function triggerHitFlash() {
    hitFlash = 6;
}

function drawHitFlash() {
    if (hitFlash <= 0) return;
    hitFlash--;
    ctx.fillStyle = `rgba(255,255,255,${hitFlash * 0.04})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}


// NUAGES
const clouds = [
    { x: 80,  y: 40, r: 28, speed: 0.18 },
    { x: 300, y: 25, r: 22, speed: 0.12 },
    { x: 520, y: 55, r: 32, speed: 0.15 },
    { x: 680, y: 30, r: 20, speed: 0.20 },
];

function updateAndDrawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const c of clouds) {
        c.x += c.speed;
        if (c.x - c.r * 2 > GAME_WIDTH) c.x = -c.r * 2;
        ctx.beginPath();
        ctx.arc(c.x,        c.y,            c.r,       0, Math.PI * 2);
        ctx.arc(c.x + c.r,  c.y - c.r*0.3,  c.r*0.75,  0, Math.PI * 2);
        ctx.arc(c.x - c.r,  c.y - c.r*0.2,  c.r*0.65,  0, Math.PI * 2);
        ctx.fill();
    }
}


// PLATEFORMES (dessin)
function drawPlatforms() {
    for (const p of platforms) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(p.x + 4, p.y + 6, p.w, p.h);

        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        grad.addColorStop(0, '#8B5E3C');
        grad.addColorStop(1, '#5C3D1E');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#5DBB3F';
        ctx.fillRect(p.x, p.y, p.w, 5);
    }
}


// ECRAN DE DEMARRAGE
function drawStartScreen() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign   = 'center';
    ctx.shadowColor = 'rgba(255,120,0,0.9)';

    const titleSize = Math.min(62, H * 0.15);
    ctx.font        = `${titleSize}px 'Black Ops One', Arial`;
    ctx.fillStyle   = '#FFD700';
    ctx.shadowBlur  = 30;
    ctx.fillText('COMBAT ARENA', W / 2, H * 0.28);

    ctx.shadowBlur  = 0;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    const subSize   = Math.min(18, H * 0.048);
    ctx.font        = `${subSize}px Arial`;
    ctx.fillStyle   = 'rgba(255,255,255,0.65)';
    ctx.fillText('Combat 1v1 local — 2 joueurs sur le meme clavier', W / 2, H * 0.42);

    const tSize = Math.min(15, H * 0.04);
    ctx.font    = `bold ${tSize}px Arial`;

    ctx.fillStyle = 'rgba(255,130,110,0.9)';
    ctx.fillText('JOUEUR 1 :  Z/Q/S/D  |  Attaque : maintenir S  |  Dash : A', W / 2, H * 0.55);

    ctx.fillStyle = 'rgba(110,150,255,0.9)';
    ctx.fillText('JOUEUR 2 :  Fleches  |  Attaque : maintenir BAS  |  Dash : /', W / 2, H * 0.64);

    ctx.fillStyle = 'rgba(200,255,180,0.75)';
    ctx.fillText('Choisis ton personnage + nom puis appuie ESPACE ou Lancer le combat', W / 2, H * 0.74);

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
        ctx.shadowBlur  = 15;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle   = '#FFD700';
        const startSize = Math.min(24, H * 0.062);
        ctx.font        = `bold ${startSize}px Arial`;
        ctx.fillText('Appuyez sur ESPACE pour commencer', W / 2, H * 0.88);
    }
    ctx.shadowBlur = 0;
}


// BARRES DE VIE
function drawHealthBars(player1, player2) {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    const padding   = Math.max(14, W * 0.025);
    const barHeight = Math.max(22, H * 0.065);
    const barWidth  = Math.min(260, W * 0.32);
    const y         = padding;
    const radius    = 4;

    // Fond
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, padding - 8,                y - 6, barWidth + 16, barHeight + 20 + barHeight * 0.6, 6);
    roundRect(ctx, W - padding - barWidth - 8, y - 6, barWidth + 16, barHeight + 20 + barHeight * 0.6, 6);

    // J1
    const hp1Pct = player1.health / 100;
    ctx.fillStyle = healthColor(hp1Pct, true);
    roundRect(ctx, padding, y, barWidth * hp1Pct, barHeight, radius);

    // J2
    const hp2Pct = player2.health / 100;
    const p2X    = W - padding - barWidth;
    ctx.fillStyle = healthColor(hp2Pct, false);
    roundRect(ctx, p2X, y, barWidth * hp2Pct, barHeight, radius);

    // Bordures
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth   = 2;
    ctx.beginPath(); roundRectPath(ctx, padding, y, barWidth, barHeight, radius); ctx.stroke();
    ctx.beginPath(); roundRectPath(ctx, p2X,     y, barWidth, barHeight, radius); ctx.stroke();

    // HP texte
    ctx.shadowBlur = 0;
    ctx.textAlign  = 'center';
    const hpFont   = Math.max(13, barHeight * 0.62);
    ctx.font       = `bold ${hpFont}px Arial`;
    ctx.fillStyle  = 'white';
    ctx.fillText(`${Math.round(player1.health)} HP`, padding + barWidth / 2, y + barHeight / 2 + hpFont * 0.36);
    ctx.fillText(`${Math.round(player2.health)} HP`, p2X    + barWidth / 2, y + barHeight / 2 + hpFont * 0.36);

    // Labels
    const lblFont = Math.max(12, H * 0.042);
    ctx.font      = `bold ${lblFont}px Arial`;

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,140,130,0.95)';
    ctx.fillText(player1.playerName || 'JOUEUR 1', padding, y + barHeight + lblFont + 2);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(130,160,255,0.95)';
    ctx.fillText(player2.playerName || 'JOUEUR 2', W - padding, y + barHeight + lblFont + 2);

    const subFont = Math.max(10, H * 0.028);
    ctx.font = `${subFont}px Arial`;

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,230,180,0.9)';
    ctx.fillText(`${player1.weaponName || 'Poings'} • ${player1.skillName || ''}`, padding, y + barHeight + lblFont + subFont + 8);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.fillText(`${player2.weaponName || 'Poings'} • ${player2.skillName || ''}`, W - padding, y + barHeight + lblFont + subFont + 8);

    // Indicateurs charge en dessous des barres
    drawChargeIndicator(player1, padding, y + barHeight + lblFont + subFont + 12, barWidth, true);
    drawChargeIndicator(player2, p2X,     y + barHeight + lblFont + subFont + 12, barWidth, false);

    // Timer
    drawTimer(W, H, padding, barHeight);
}


// INDICATEUR COUP CHARGE (mini barre sous le label)
function drawChargeIndicator(p, x, y, bw, isP1) {
    if (p.chargeTimer <= 0) return;
    const pct = Math.min(p.chargeTimer / 40, 1);
    const h   = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y + 2, bw, h);
    ctx.fillStyle   = pct >= 1 ? '#FFD700' : (isP1 ? '#ff7755' : '#5577ff');
    ctx.shadowColor = pct >= 1 ? '#FFD700' : 'transparent';
    ctx.shadowBlur  = pct >= 1 ? 8 : 0;
    ctx.fillRect(x, y + 2, bw * pct, h);
    ctx.shadowBlur = 0;
}


// TIMER
function drawTimer(W, H, padding, barHeight) {
    if (typeof matchTimer === 'undefined') return;
    const seconds  = Math.ceil(matchTimer / 60);
    const timerStr = seconds.toString().padStart(2, '0');
    const isLow    = seconds <= 10;

    ctx.textAlign = 'center';
    const timerFont = Math.max(20, barHeight * 1.1);
    ctx.font = `bold ${timerFont}px 'Black Ops One', Arial`;

    if (isLow) {
        ctx.fillStyle   = seconds % 2 === 0 ? '#ff4444' : '#ffaa00';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur  = 15;
    } else {
        ctx.fillStyle  = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = 0;
    }

    ctx.fillText(timerStr, W / 2, padding + barHeight * 0.85);
    ctx.shadowBlur = 0;
}


// ECRAN DE FIN
function drawGameOver(winner) {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    const titleSize = Math.min(58, H * 0.145);
    ctx.font        = `${titleSize}px 'Black Ops One', Arial`;
    ctx.shadowColor = 'rgba(255,200,0,0.8)';
    ctx.shadowBlur  = 25;
    ctx.fillStyle   = '#FFD700';
    ctx.fillText('FIN DU COMBAT !', W / 2, H / 2 - H * 0.1);

    const winSize = Math.min(44, H * 0.11);
    ctx.font       = `${winSize}px 'Black Ops One', Arial`;
    ctx.shadowBlur = 18;

    if (winner === player1) {
        ctx.shadowColor = '#ff6666';
        ctx.fillStyle   = '#FF7777';
        ctx.fillText(`${player1.playerName || 'JOUEUR 1'} VICTOIRE !`, W / 2, H / 2 + H * 0.06);
    } else if (winner === player2) {
        ctx.shadowColor = '#6688ff';
        ctx.fillStyle   = '#7799FF';
        ctx.fillText(`${player2.playerName || 'JOUEUR 2'} VICTOIRE !`, W / 2, H / 2 + H * 0.06);
    } else {
        ctx.shadowColor = '#aaaaaa';
        ctx.fillStyle   = '#cccccc';
        ctx.fillText('EGALITE !', W / 2, H / 2 + H * 0.06);
    }

    ctx.shadowBlur = 0;
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
        const restartSize = Math.min(22, H * 0.058);
        ctx.font      = `bold ${restartSize}px Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('Appuyez sur ESPACE pour rejouer', W / 2, H / 2 + H * 0.28);
    }
}


// HELPERS
function healthColor(pct, isP1) {
    if (pct > 0.5)  return isP1 ? '#4CAF50' : '#2196F3';
    if (pct > 0.25) return '#FF9800';
    return '#f44336';
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
}

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
}