// main.js — FreeForce 2D — version améliorée
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH  = 1024;
const GAME_HEIGHT = 576;
const GROUND_Y    = GAME_HEIGHT - 100;

let DPR = 1;
let cameraX = 0;
let score = 0;
let bestScore = 0;
let combo = 0;
let comboTimer = 0;
let isGameOver = false;
let gameState = 'menu'; // 'menu' | 'playing' | 'gameover'
let scoreHistory = JSON.parse(localStorage.getItem('ff2d_scores') || '[]');
let difficulty   = localStorage.getItem('ff2d_diff') || 'NORMAL';
let particles = [];
let bullets = [];
let rocketBullets = [];
let enemyBullets = [];
let enemies = [];
let platforms = [];
let powerups = [];
let floatingTexts = [];
let explosionFlashes = [];
let gameTime = 0;
let ammoSpawnTimer = 0;

// ── Weapons ────────────────────────────────────────
const WEAPONS_DATA = {
    pistol:  { label: 'PISTOL',  icon: '🔫', color: '#ffff88', fireRate: 7,  ammoMax: 60,  ammoGrant: 60,  bulletSpeed: 14, spread: 0, pellets: 1, damage: 1 },
    shotgun: { label: 'SHOTGUN', icon: '💥', color: '#ff8800', fireRate: 22, ammoMax: 24,  ammoGrant: 12,  bulletSpeed: 12, spread: 0.28, pellets: 5, damage: 1 },
    rocket:  { label: 'ROCKET',  icon: '🚀', color: '#ff4400', fireRate: 40, ammoMax: 10,  ammoGrant: 5,   bulletSpeed: 9,  spread: 0, pellets: 1, damage: 5 },
    laser:   { label: 'LASER',   icon: '⚡', color: '#44ffff', fireRate: 14, ammoMax: 20,  ammoGrant: 10,  bulletSpeed: 22, spread: 0, pellets: 1, damage: 2 },
    smg:     { label: 'SMG',     icon: '▸', color: '#a5f27b', fireRate: 4, ammoMax: 160, ammoGrant: 100, bulletSpeed: 16, spread: 0.11, pellets: 1, damage: 1 },
    dmr:     { label: 'DMR',     icon: '⌖', color: '#dbb6ff', fireRate: 28, ammoMax: 36, ammoGrant: 24, bulletSpeed: 24, spread: 0.01, pellets: 1, damage: 4 },
    lmg:     { label: 'LMG',     icon: '▰', color: '#ffca78', fireRate: 9, ammoMax: 220, ammoGrant: 120, bulletSpeed: 15, spread: 0.13, pellets: 1, damage: 2 },
};

// ── Resize ─────────────────────────────────────────
function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width  = w * DPR;
    canvas.height = h * DPR;
    ctx.scale(DPR, DPR);
}
window.addEventListener('resize', () => { resizeCanvas(); });
resizeCanvas();

// ── Particule ──────────────────────────────────────
class Particle {
    constructor(x, y, vx, vy, color, life, size = null) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.life = life; this.maxLife = life;
        this.size = size ?? (Math.random() * 5 + 2);
        this.gravity = 0.25;
    }
    update() {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.97;
        this.life--;
        this.size *= 0.98;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.pow(this.life / this.maxLife, 0.6);
        ctx.fillStyle   = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 6;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

// ── Floating text ──────────────────────────────────
function spawnText(x, y, text, color = '#ffdd00', size = 14) {
    floatingTexts.push({ x, y, text, color, size, life: 55, maxLife: 55, vy: -1.5 });
}

// ── Screen Shake ───────────────────────────────────
let shakeX = 0, shakeY = 0;
let shakeIntensity = 0;
function screenShake(i) {
    shakeIntensity = Math.max(shakeIntensity, i);
    shakeX = (Math.random() - 0.5) * i;
    shakeY = (Math.random() - 0.5) * i;
}

// ── Explosion Flash ────────────────────────────────
function spawnExplosionFlash(x, y, radius, color) {
    explosionFlashes.push({ x, y, radius, maxRadius: radius, color, life: 12, maxLife: 12 });
}

// ── Plateformes ────────────────────────────────────
class Platform {
    constructor(x, y, w) {
        this.x = x; this.y = y;
        this.w = w; this.h = 18;
        this.baseY = y;
        this.floating = Math.random() < 0.4; // certaines bougent verticallement
        this.t = Math.random() * Math.PI * 2;
        this.floatAmp = this.floating ? 22 + Math.random() * 18 : 0;
        this.floatSpd = 0.018 + Math.random() * 0.012;
        this.crumble = false;
        this.crumbleTimer = 0;
    }
    update() {
        this.t += this.floatSpd;
        if (this.floating) this.y = this.baseY + Math.sin(this.t) * this.floatAmp;
        if (this.crumble) {
            this.crumbleTimer++;
            if (this.crumbleTimer > 30) {
                // Spawn particules d'effondrement
                for (let i = 0; i < 6; i++) {
                    particles.push(new Particle(
                        this.x + Math.random() * this.w, this.y + this.h / 2,
                        (Math.random() - 0.5) * 6, -Math.random() * 4,
                        '#885522', 35, 5
                    ));
                }
                return true; // à supprimer
            }
        }
        return false;
    }
    draw() {
        ctx.save();
        const alpha = this.crumble ? Math.max(0.2, 1 - this.crumbleTimer / 30) : 1;
        ctx.globalAlpha = alpha;

        // Ombre portée
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(this.x + 4, this.y + 6, this.w, this.h);

        // Corps principal
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, this.floating ? '#cc6600' : '#884400');
        grad.addColorStop(1, this.floating ? '#663300' : '#441800');
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Bord supérieur lumineux
        ctx.fillStyle = this.floating ? '#ff8800' : '#aa5500';
        ctx.fillRect(this.x, this.y, this.w, 3);

        // Rivets décoratifs
        ctx.fillStyle = '#ffaa44';
        for (let rx = 12; rx < this.w - 8; rx += 28) {
            ctx.beginPath();
            ctx.arc(this.x + rx, this.y + 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Halo flottant
        if (this.floating) {
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(255,100,0,0.4)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}

// Génération de plateformes devant le joueur
function ensurePlatforms() {
    const maxX = cameraX + GAME_WIDTH + 400;
    let lastX = platforms.length > 0 ? Math.max(...platforms.map(p => p.x + p.w)) : cameraX + 600;

    while (lastX < maxX) {
        const gap = 140 + Math.random() * 180;
        const w   = 80 + Math.random() * 140;
        const y   = GROUND_Y - 80 - Math.random() * 200;
        platforms.push(new Platform(lastX + gap, y, w));
        lastX += gap + w;
    }
    // Nettoyer les trop lointaines derrière
    platforms = platforms.filter(p => p.x + p.w > cameraX - 200);
}

// ── Power-ups ──────────────────────────────────────
const POWERUP_TYPES = [
    { id: 'health',         color: '#00ff88', label: '♥ +30 HP',      icon: '♥' },
    { id: 'ammo',           color: '#ffdd00', label: '◎ AMMO',         icon: '◎' },
    { id: 'ammo_big',       color: '#ffee44', label: '◎◎ BIG AMMO',    icon: '◎' },
    { id: 'shield',         color: '#44aaff', label: '◈ SHIELD',       icon: '◈' },
    { id: 'rapid',          color: '#ff8800', label: '⚡ RAPID',        icon: '⚡' },
    { id: 'nuke',           color: '#ff4400', label: '☢ NUKE',         icon: '☢' },
    { id: 'wpn_shotgun',    color: '#ff8800', label: '🔫 SHOTGUN',      icon: 'SG' },
    { id: 'wpn_rocket',     color: '#ff4400', label: '🚀 ROCKET',       icon: 'RL' },
    { id: 'wpn_laser',      color: '#44ffff', label: '⚡ LASER',        icon: 'LZ' },
    { id: 'wpn_pistol',     color: '#ffff88', label: '◎ PISTOL',       icon: 'PT' },
    { id: 'wpn_smg',        color: '#a5f27b', label: 'SMG', icon: 'SM' },
    { id: 'wpn_dmr',        color: '#dbb6ff', label: 'DMR', icon: 'DM' },
    { id: 'wpn_lmg',        color: '#ffca78', label: 'LMG', icon: 'LM' },
];

class PowerUp {
    constructor(x, y, typeId) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.typeId = typeId;
        const t = POWERUP_TYPES.find(p => p.id === typeId);
        this.color = t.color;
        this.label = t.label;
        this.icon  = t.icon;
        this.size  = 22;
        this.t     = Math.random() * Math.PI * 2;
        this.collected = false;
    }
    update() {
        this.t += 0.06;
        this.y = this.baseY + Math.sin(this.t) * 7;
        return this.x + this.size < cameraX - 60; // hors écran ?
    }
    draw() {
        ctx.save();
        // Halo
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.8);
        glow.addColorStop(0, this.color + '55');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Corps
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = this.color; ctx.shadowBlur = 14;
        ctx.stroke();
        // Icône
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 8;
        ctx.fillText(this.icon, this.x, this.y + 1);
        ctx.restore();
    }
}

function spawnPowerUp(x, y, forceAmmo) {
    const r = Math.random();
    let typeId;
    if (forceAmmo) {
        typeId = Math.random() < 0.6 ? 'ammo' : 'ammo_big';
    } else if (r < 0.20) { typeId = 'health'; }
    else if (r < 0.42)   { typeId = 'ammo'; }
    else if (r < 0.58)   { typeId = 'ammo_big'; }
    else if (r < 0.66)   { typeId = 'shield'; }
    else if (r < 0.72)   { typeId = 'rapid'; }
    else if (r < 0.80)   { typeId = 'wpn_shotgun'; }
    else if (r < 0.88)   { typeId = 'wpn_rocket'; }
    else if (r < 0.93)   { typeId = 'wpn_laser'; }
    else if (r < 0.955)  { typeId = 'wpn_smg'; }
    else if (r < 0.975)  { typeId = 'wpn_dmr'; }
    else if (r < 0.995)  { typeId = 'wpn_lmg'; }
    else                  { typeId = 'nuke'; }
    powerups.push(new PowerUp(x, y, typeId));
}

// ── Joueur ─────────────────────────────────────────
class Player {
    constructor() { this.reset(); }
    reset() {
        this.x = 200; this.y = GROUND_Y - 64;
        this.width = 44; this.height = 60;
        this.vx = 0; this.vy = 0;
        this.speed = 6;
        this.jumpPower  = -15;
        this.gravity    = 0.72;
        this.onGround   = true;
        this.onPlatform = false;
        this.jumpsLeft  = 2;
        this.health     = 100;
        this.maxHealth  = 100;
        this.weapon     = 'pistol';
        this.ammo       = 60;
        this.maxAmmo    = 60;
        this.shootCooldown = 0;
        this.facingRight   = true;
        this.invincible    = 0;
        this.runFrame      = 0;
        this.runTimer      = 0;
        this.dashCooldown  = 0;
        this.dashing       = 0;
        this.shieldTimer   = 0;
        this.rapidTimer    = 0;
        this._angle        = 0;
        this._emptyTimer   = 0;
    }

    update() {
        const moving = keys['a'] || keys['arrowleft'] || keys['d'] || keys['arrowright'];

        // Timers power-ups
        if (this.shieldTimer > 0) this.shieldTimer--;
        if (this.rapidTimer  > 0) this.rapidTimer--;

        // Dash
        if (keys['shift'] && this.dashCooldown <= 0 && !this.dashing) {
            this.dashing = 10;
            this.dashCooldown = 45;
            const dir = this.facingRight ? 1 : -1;
            this.vx = dir * 22;
            spawnDash(this.x + this.width / 2, this.y + this.height / 2, dir);
        }

        // Mouvement horizontal
        if (!this.dashing) {
            if (keys['a'] || keys['arrowleft'])       { this.vx = -this.speed; this.facingRight = false; }
            else if (keys['d'] || keys['arrowright'])  { this.vx =  this.speed; this.facingRight = true;  }
            else { this.vx *= 0.80; }
        } else {
            this.dashing--;
            this.vx *= 0.85;
        }

        // Saut double
        if (jumpPressed) {
            if (this.jumpsLeft > 0) {
                this.vy = this.jumpsLeft === 2 ? this.jumpPower : this.jumpPower * 0.85;
                this.jumpsLeft--;
                this.onGround = false;
                this.onPlatform = false;
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        this.x + this.width / 2, this.y + this.height,
                        (Math.random() - 0.5) * 5, Math.random() * 3,
                        '#ffcc44', 22
                    ));
                }
            }
            jumpPressed = false;
        }

        // Physique
        this.vy += this.gravity;
        if (this.vy > 22) this.vy = 22;
        this.y += this.vy;
        this.x += this.vx;

        // Collision sol
        this.onGround = false;
        this.onPlatform = false;
        if (this.y >= GROUND_Y - this.height) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
            this.jumpsLeft = 2;
        }

        // Collision plateformes (descente uniquement)
        if (this.vy >= 0) {
            for (const p of platforms) {
                const prevBottom = this.y + this.height - this.vy;
                const curBottom  = this.y + this.height;
                const inXRange   = this.x + this.width > p.x + 6 && this.x < p.x + p.w - 6;
                const crossed    = prevBottom <= p.y + 2 && curBottom >= p.y;
                if (inXRange && crossed) {
                    this.y  = p.y - this.height;
                    this.vy = 0;
                    this.onGround   = true;
                    this.onPlatform = true;
                    this.jumpsLeft  = 2;
                }
            }
        }

        // Limite gauche
        if (this.x < cameraX) this.x = cameraX;

        // Tir (touche F)
        const wdata = WEAPONS_DATA[this.weapon] || WEAPONS_DATA.pistol;
        const cooldown = this.rapidTimer > 0 ? Math.ceil(wdata.fireRate / 2) : wdata.fireRate;
        const shootKey = keys['f'] || keys['control'];
        if (shootKey && this.shootCooldown <= 0 && this.ammo > 0) {
            const bx = this.x + (this.facingRight ? this.width + 4 : -12);
            const by = this.y + 22;
            if (this.weapon === 'rocket') {
                rocketBullets.push(new RocketBullet(bx, by, this.facingRight));
            } else {
                for (let p = 0; p < wdata.pellets; p++) {
                    const angle = (Math.random() - 0.5) * wdata.spread;
                    const spd   = wdata.bulletSpeed;
                    const vx    = (this.facingRight ? spd : -spd) * Math.cos(angle);
                    const vy    = -0.5 + Math.sin(angle) * spd;
                    bullets.push(new Bullet(bx, by, this.facingRight, vx, vy, wdata));
                }
            }
            this.ammo--;
            this.shootCooldown = cooldown;
            this.vx += this.facingRight ? -0.8 : 0.8;
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(bx, by + 2,
                    (this.facingRight ? 3 : -3) + (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 3,
                    wdata.color, 12, 3));
            }
        }
        // Clic vide
        if (shootKey && this.shootCooldown <= 0 && this.ammo <= 0) {
            this._emptyTimer = 8;
        }
        if (this._emptyTimer > 0) this._emptyTimer--;

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.dashCooldown  > 0) this.dashCooldown--;
        if (this.invincible    > 0) this.invincible--;

        // Animation course
        if (moving && this.onGround) {
            this.runTimer++;
            if (this.runTimer % 8 === 0) this.runFrame = (this.runFrame + 1) % 4;
        } else if (!moving) { this.runFrame = 0; }

        // Power-up collecte
        for (let i = powerups.length - 1; i >= 0; i--) {
            const pu = powerups[i];
            const dx = (this.x + this.width / 2) - pu.x;
            const dy = (this.y + this.height / 2) - pu.y;
            if (Math.sqrt(dx * dx + dy * dy) < 32) {
                this._applyPowerUp(pu.typeId);
                spawnText(pu.x, pu.y - 20, pu.label, pu.color, 11);
                for (let j = 0; j < 14; j++) {
                    particles.push(new Particle(pu.x, pu.y,
                        (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10 - 2,
                        pu.color, 35));
                }
                powerups.splice(i, 1);
            }
        }

        // Caméra
        cameraX = Math.max(this.x - GAME_WIDTH / 3, cameraX + 0.8);
    }

    _applyPowerUp(id) {
        if (id === 'health')  { this.health = Math.min(this.maxHealth, this.health + 30); screenShake(4); }
        if (id === 'ammo') {
            const wd = WEAPONS_DATA[this.weapon] || WEAPONS_DATA.pistol;
            this.ammo = Math.min(wd.ammoMax, this.ammo + wd.ammoMax / 2);
        }
        if (id === 'ammo_big') {
            const wd = WEAPONS_DATA[this.weapon] || WEAPONS_DATA.pistol;
            this.ammo = wd.ammoMax;
        }
        if (id === 'shield')  { this.shieldTimer = 300; screenShake(4); }
        if (id === 'rapid')   { this.rapidTimer  = 300; }
        if (id.startsWith('wpn_')) {
            const wpn = id.replace('wpn_', '');
            this.weapon  = wpn;
            const wd     = WEAPONS_DATA[wpn];
            this.ammo    = wd.ammoGrant;
            this.maxAmmo = wd.ammoMax;
            screenShake(6);
            spawnText(this.x + this.width / 2, this.y - 30, wd.label + ' EQUIPPED!', wd.color, 13);
        }
        if (id === 'nuke') {
            // Tue tous les ennemis à l'écran
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                if (e.x > cameraX - 100 && e.x < cameraX + GAME_WIDTH + 100) {
                    spawnExplosionFlash(e.x + e.width / 2, e.y + e.height / 2, 80, '#ff4400');
                    explode(e, e.type === 'boss' ? 500 : 200, '#ff8800');
                    enemies.splice(i, 1);
                }
            }
            screenShake(30);
            spawnText(cameraX + GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'NUKE!', '#ff4400', 28);
        }
    }

    draw() {
        ctx.save();
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) ctx.globalAlpha = 0.4;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (!this.facingRight) ctx.scale(-1, 1);

        const hw = this.width / 2, hh = this.height / 2;
        const legOffset = [0,3,0,-3][this.runFrame] * (this.onGround && (keys['a']||keys['d']||keys['arrowleft']||keys['arrowright']) ? 1 : 0);

        // Bouclier visuel
        if (this.shieldTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.15 * Math.sin(Date.now() * 0.01);
            ctx.strokeStyle = '#44aaff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        // Aura rapid fire
        if (this.rapidTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.2 + 0.1 * Math.sin(Date.now() * 0.02);
            ctx.fillStyle = '#ff8800';
            ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Jambes
        ctx.fillStyle = '#cc8800';
        ctx.fillRect(-hw + 4, hh - 20, 14, 20 + legOffset);
        ctx.fillRect(hw - 18, hh - 20, 14, 20 - legOffset);
        // Corps
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(-hw + 2, -hh + 18, this.width - 4, this.height - 36);
        // Torse
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-hw + 2, -hh + 18, this.width - 4, 22);
        // Tête/casque
        ctx.fillStyle = '#cc6600';
        ctx.fillRect(-hw + 6, -hh, this.width - 12, 22);
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(-hw + 10, -hh + 6, this.width - 22, 10);
        // Bras + arme
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(hw - 6, -hh + 22, 12, 10);
        ctx.fillStyle = '#888';
        ctx.fillRect(hw + 4,  -hh + 24, 18, 7);
        ctx.fillStyle = '#555';
        ctx.fillRect(hw + 20, -hh + 23, 6, 4);

        ctx.restore();
    }

    hit(damage) {
        if (this.invincible > 0) return;
        if (this.shieldTimer > 0) {
            // Bouclier absorbe
            spawnText(this.x + this.width / 2, this.y - 10, 'SHIELD!', '#44aaff', 12);
            screenShake(5);
            return;
        }
        this.health -= damage;
        this.invincible = 55;
        triggerDmgFlash();
        screenShake(12);
        if (this.health <= 0) {
            this.health = 0;
            isGameOver  = true;
            gameState   = 'gameover';
            // Sauvegarde du score
            scoreHistory.push({ score, difficulty, date: new Date().toLocaleDateString('fr-FR') });
            scoreHistory.sort((a, b) => b.score - a.score);
            scoreHistory = scoreHistory.slice(0, 8);
            if (score > bestScore) bestScore = score;
            localStorage.setItem('ff2d_scores', JSON.stringify(scoreHistory));
            // Afficher l'overlay HTML
            setTimeout(() => { if (typeof window.showGameOver === 'function') window.showGameOver(score, bestScore); }, 400);
            if (score > bestScore) bestScore = score;
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2, this.y + this.height / 2,
                    (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14 - 6,
                    ['#ffdd00','#ff8800','#ff4400'][Math.floor(Math.random()*3)], 90
                ));
            }
        }
    }
}

function spawnDash(x, y, dir) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y,
            -dir * (Math.random() * 8 + 2), (Math.random() - 0.5) * 4,
            '#88eeff', 20, 4));
    }
}

// ── Balle joueur ───────────────────────────────────
class Bullet {
    constructor(x, y, right, vx, vy, wdata) {
        this.x = x; this.y = y;
        const wd = wdata || WEAPONS_DATA.pistol;
        this.vx = (vx !== undefined) ? vx : (right ? 14 : -14);
        this.vy = (vy !== undefined) ? vy : -0.5;
        this.width = 10; this.height = 5;
        this.life = 180;
        this.trail = [];
        this.color  = wd.color || '#ffff88';
        this.damage = wd.damage || 1;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08;
        this.life--;
    }
    draw() {
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.globalAlpha = (i / this.trail.length) * 0.4;
            ctx.fillStyle = this.color;
            ctx.fillRect(t.x, t.y + 1, 6, 3);
        }
        ctx.restore();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color; ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// ── Rocket ─────────────────────────────────────────
class RocketBullet {
    constructor(x, y, right) {
        this.x = x; this.y = y;
        this.vx = right ? 9 : -9;
        this.vy = 0;
        this.width = 16; this.height = 8;
        this.life = 220;
        this.right = right;
        this.t = 0;
        this.damage = 5;
    }
    update() {
        this.t++;
        this.x += this.vx;
        this.life--;
        // Smoke trail
        if (this.t % 3 === 0) {
            particles.push(new Particle(this.x + (this.right ? -8 : 8), this.y + 4,
                (Math.random()-0.5)*2, -Math.random()*1.5, '#888866', 20, 4));
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (!this.right) ctx.scale(-1, 1);
        // Body
        ctx.fillStyle = '#888';
        ctx.fillRect(-8, -3, 16, 6);
        // Nose
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.fill();
        // Exhaust flame
        const flame = 0.7 + 0.3 * Math.sin(this.t * 0.5);
        ctx.fillStyle = '#ff6600';
        ctx.globalAlpha = flame;
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8-8*flame, -3); ctx.lineTo(-8-8*flame, 3); ctx.fill();
        ctx.restore();
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
        ctx.shadowBlur = 0;
    }
    explodeAt(cx, cy) {
        const radius = 80;
        spawnExplosionFlash(cx, cy, radius, '#ff6600');
        screenShake(18);
        for (let i = 0; i < 25; i++) {
            particles.push(new Particle(cx, cy, (Math.random()-0.5)*14, (Math.random()-0.5)*14-4,
                ['#ff4400','#ff8800','#ffdd00'][Math.floor(Math.random()*3)], 55 + Math.random()*20));
        }
        // AoE damage
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = (e.x + e.width/2) - cx;
            const dy = (e.y + e.height/2) - cy;
            if (Math.sqrt(dx*dx+dy*dy) < radius) {
                if (e.hit(5)) enemies.splice(j, 1);
            }
        }
    }
}

// ── Balle ennemie ──────────────────────────────────
class EnemyBullet {
    constructor(x, y, vx, vy, color) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color || '#ff4444';
        this.width = 8; this.height = 8;
        this.life = 160;
        this.trail = [];
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 4) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw() {
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            ctx.globalAlpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = this.color;
            const t = this.trail[i];
            ctx.fillRect(t.x - 3, t.y - 3, 6, 6);
        }
        ctx.restore();
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ── Ennemis ────────────────────────────────────────
function explode(enemy, pts, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            enemy.x + enemy.width  / 2, enemy.y + enemy.height / 2,
            (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12 - 4,
            color, 55 + Math.random() * 30
        ));
    }
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(
            enemy.x + enemy.width  / 2, enemy.y + enemy.height / 2,
            (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6 - 2,
            '#cc0000', 70, 6
        ));
    }
    spawnExplosionFlash(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 60, color);
    combo++;
    comboTimer = 90;
    const earned = pts * combo;
    score += earned;
    spawnText(enemy.x + enemy.width / 2, enemy.y, `+${earned}`, combo > 2 ? '#ff8800' : '#ffdd00');
    screenShake(combo > 3 ? 20 : 12);

    // Chance de drop power-up (augmentée)
    if (Math.random() < 0.50) spawnPowerUp(enemy.x + enemy.width / 2, enemy.y - 20, false);

    return true;
}

class EnemyBasic {
    constructor(x) {
        this.x = x; this.y = GROUND_Y - 52;
        this.width = 34; this.height = 52;
        this.vx = -(1.8 + Math.random() * 1.2);
        this.hp = 1; this.maxHp = 1;
        this.type = 'basic';
        this.frame = 0; this.frameTimer = 0;
    }
    update() { this.x += this.vx; this.frameTimer++; if (this.frameTimer % 10 === 0) this.frame = (this.frame + 1) % 2; }
    draw() {
        const legSwing = this.frame === 0 ? 4 : -4;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.fillStyle = '#550000'; ctx.fillRect(-10, 12, 10, 20 + legSwing); ctx.fillRect(0, 12, 10, 20 - legSwing);
        ctx.fillStyle = '#aa0000'; ctx.fillRect(-14, -10, 28, 26);
        ctx.fillStyle = '#cc2200'; ctx.fillRect(-10, -26, 20, 20);
        ctx.fillStyle = '#ffff00'; ctx.fillRect(-6, -22, 5, 5); ctx.fillRect(2, -22, 5, 5);
        ctx.restore();
    }
    hit(dmg) { return explode(this, 100, '#ff4444'); }
}

class EnemyHeavy {
    constructor(x) {
        this.x = x; this.y = GROUND_Y - 72;
        this.width = 48; this.height = 72;
        this.vx = -(0.9 + Math.random() * 0.6);
        this.hp = 3; this.maxHp = 3;
        this.type = 'heavy';
        this.frame = 0; this.frameTimer = 0;
    }
    update() { this.x += this.vx; this.frameTimer++; if (this.frameTimer % 14 === 0) this.frame = (this.frame + 1) % 2; }
    draw() {
        const legSwing = this.frame === 0 ? 5 : -5;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.fillStyle = '#440055'; ctx.fillRect(-14, 18, 14, 22 + legSwing); ctx.fillRect(0, 18, 14, 22 - legSwing);
        ctx.fillStyle = '#882299'; ctx.fillRect(-20, -14, 40, 36);
        ctx.fillStyle = '#551188'; ctx.fillRect(-14, -32, 28, 22);
        ctx.fillStyle = '#ff88ff'; ctx.fillRect(-8, -28, 7, 7); ctx.fillRect(2, -28, 7, 7);
        ctx.fillStyle = '#aa44cc'; ctx.fillRect(-26, -10, 10, 18); ctx.fillRect(16, -10, 10, 18);
        ctx.restore();
        const bw = this.width + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(this.x - 4, this.y - 14, bw, 7);
        ctx.fillStyle = '#ff44ff'; ctx.fillRect(this.x - 4, this.y - 14, bw * (this.hp / this.maxHp), 7);
    }
    hit(dmg) {
        this.hp -= (dmg || 1);
        if (this.hp <= 0) return explode(this, 300, '#bb44ff');
        screenShake(5);
        for (let i = 0; i < 6; i++) particles.push(new Particle(this.x+this.width/2, this.y+this.height/2, (Math.random()-.5)*7, (Math.random()-.5)*7-3, '#ff88ff', 25));
        return false;
    }
}

class EnemyFlying {
    constructor(x) {
        this.x = x; this.y = GROUND_Y - 160 - Math.random() * 100;
        this.width = 36; this.height = 28;
        this.vx = -(2.2 + Math.random() * 1.4); this.vy = 0;
        this.hp = 1; this.maxHp = 1;
        this.type = 'flying';
        this.t = Math.random() * Math.PI * 2;
    }
    update() { this.x += this.vx; this.t += 0.06; this.y += Math.sin(this.t) * 1.8; }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        const wing = Math.sin(this.t * 4) * 8;
        ctx.fillStyle = '#ff6600'; ctx.beginPath(); ctx.ellipse(-18, -wing, 14, 7, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(18, -wing, 14, 7, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4400'; ctx.fillRect(-10, -8, 20, 16);
        ctx.fillStyle = '#ff6600'; ctx.fillRect(-6, -16, 12, 12);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -14, 4, 5); ctx.fillRect(1, -14, 4, 5);
        ctx.restore();
    }
    hit(dmg) { return explode(this, 150, '#ff8844'); }
}

// ── Ennemi Tireur (style Contra/Broforce) ──────────
class EnemyShooter {
    constructor(x) {
        this.x = x; this.y = GROUND_Y - 58;
        this.width = 36; this.height = 58;
        this.vx = -(1.0 + Math.random() * 0.5);
        this.hp = 3; this.maxHp = 3;
        this.type = 'shooter';

        // États : 'patrol' | 'alert' | 'combat' | 'reloading'
        this.state       = 'patrol';
        this.alertTimer  = 0;   // temps d'alerte avant de tirer
        this.shootTimer  = 0;
        this.burstCount  = 0;   // balles restantes dans la rafale
        this.burstPause  = 0;   // pause entre rafales
        this.reloadTimer = 0;
        this.frame       = 0;
        this.frameTimer  = 0;
        this.shootFlash  = 0;   // flash visuel canon
        this.spotted     = false;
    }

    update(playerX, playerY) {
        const cx      = this.x + this.width / 2;
        const cy      = this.y + this.height / 2;
        const dx      = playerX - cx;
        const dy      = playerY - cy;
        const dist    = Math.abs(dx);
        const visible = dist < GAME_WIDTH * 1.4; // détection sur ~1,4 écrans
        const facingPlayer = dx < 0; // l'ennemi vient de droite, le joueur est à gauche

        this.frameTimer++;
        if (this.frameTimer % 10 === 0) this.frame = (this.frame + 1) % 2;
        if (this.shootFlash > 0) this.shootFlash--;

        // ── Machine d'états ──────────────────────
        if (this.state === 'patrol') {
            this.vx = -(1.2 + Math.random() * 0.2);
            this.x += this.vx;
            if (visible && !this.spotted) {
                this.spotted    = true;
                this.state      = 'alert';
                this.alertTimer = 28; // ~0.5s de réaction
                spawnText(cx, this.y - 28, '!', '#ff4400', 16);
                screenShake(3);
            }

        } else if (this.state === 'alert') {
            // S'arrête, se retourne, s'apprête à tirer
            this.vx *= 0.85;
            this.x += this.vx;
            this.alertTimer--;
            if (this.alertTimer <= 0) {
                this.state      = 'combat';
                this.burstCount = 3 + Math.floor(Math.random() * 3); // 3-5 balles par rafale
                this.shootTimer = 8;
            }

        } else if (this.state === 'combat') {
            // S'avance lentement ou s'arrête selon la distance
            if (dist > 500) {
                this.vx += (-1.5 - this.vx) * 0.08; // s'approche
            } else if (dist < 180) {
                this.vx += (1.2 - this.vx) * 0.08;  // recule si trop près
            } else {
                this.vx *= 0.88; // se fige pour viser
            }
            this.x += this.vx;

            if (this.burstPause > 0) {
                this.burstPause--;
                if (this.burstPause <= 0) {
                    this.burstCount = 3 + Math.floor(Math.random() * 3);
                    this.shootTimer = 8;
                }
            } else {
                this.shootTimer--;
                if (this.shootTimer <= 0 && this.burstCount > 0) {
                    this._fire(playerX, playerY);
                    this.burstCount--;
                    this.shootTimer = 12; // cadence intra-rafale
                    if (this.burstCount <= 0) {
                        this.burstPause  = 55 + Math.floor(Math.random() * 40); // pause entre rafales
                        this.state       = 'reloading';
                        this.reloadTimer = 35;
                    }
                }
            }

            // Perd le joueur s'il est trop loin
            if (dist > GAME_WIDTH * 1.6) {
                this.spotted = false;
                this.state   = 'patrol';
            }

        } else if (this.state === 'reloading') {
            this.vx *= 0.9;
            this.x += this.vx;
            this.reloadTimer--;
            if (this.reloadTimer <= 0) {
                this.state      = 'combat';
                this.burstPause = 0;
            }
        }
    }

    _fire(playerX, playerY) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const dx = playerX - cx;
        const dy = playerY - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 8.5;

        // Légère imprécision (style Contra)
        const spread = 0.08;
        const angle  = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;

        enemyBullets.push(new EnemyBullet(cx, cy,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            '#ff3300'));

        this.shootFlash = 5;
        // Flash de tir
        for (let i = 0; i < 4; i++) {
            particles.push(new Particle(cx + (dx < 0 ? -18 : 18), cy,
                (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5,
                '#ffaa00', 10, 3));
        }
    }

    draw() {
        const legSwing   = (this.state === 'patrol' || Math.abs(this.vx) > 0.5)
            ? (this.frame === 0 ? 3 : -3) : 0;
        const isCombat   = this.state === 'combat' || this.state === 'reloading';
        const facingLeft = this.spotted; // regarde vers le joueur (joueur vient de gauche)

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (!facingLeft) ctx.scale(-1, 1); // retourné selon orientation

        // Jambes
        ctx.fillStyle = '#330000';
        ctx.fillRect(-8, 10, 10, 18 + legSwing);
        ctx.fillRect(2,  10, 10, 18 - legSwing);

        // Corps
        ctx.fillStyle = isCombat ? '#880000' : '#660000';
        ctx.fillRect(-15, -8, 30, 22);

        // Tête / casque
        ctx.fillStyle = '#880000';
        ctx.fillRect(-10, -24, 20, 20);

        // Yeux — rouges en combat, jaunes en patrouille
        ctx.fillStyle = isCombat ? '#ff0000' : '#ff8800';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
        ctx.fillRect(-5, -20, 5, 5);
        ctx.fillRect(2,  -20, 5, 5);
        ctx.shadowBlur = 0;

        // Bras + canon (posture combat : tendu vers l'avant)
        const armY = isCombat ? -6 : -2;
        ctx.fillStyle = '#993300';
        ctx.fillRect(12, armY, 10, 8);
        // Canon
        ctx.fillStyle = this.shootFlash > 0 ? '#ffcc00' : '#444';
        ctx.fillRect(20, armY + 1, 18, 6);
        ctx.fillStyle = '#222';
        ctx.fillRect(36, armY + 2, 6, 4);

        // Flash de tir
        if (this.shootFlash > 0) {
            ctx.globalAlpha = this.shootFlash / 5;
            ctx.fillStyle   = '#ffff00';
            ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(44, armY + 4, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Barre HP
        const bw = this.width + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(this.x - 2, this.y - 12, bw, 5);
        ctx.fillStyle = this.state === 'combat' ? '#ff2200' : '#ff6600';
        ctx.fillRect(this.x - 2, this.y - 12, bw * (this.hp / this.maxHp), 5);

        // Indicateur état "ALERT" clignotant
        if (this.state === 'alert' && Math.floor(this.alertTimer / 5) % 2 === 0) {
            ctx.save();
            ctx.font        = '9px "Press Start 2P", monospace';
            ctx.fillStyle   = '#ff0000';
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 14;
            ctx.textAlign   = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y - 18);
            ctx.shadowBlur  = 0;
            ctx.restore();
        }

        // Point rouge "en visée" en mode combat
        if (this.state === 'combat' && this.burstPause <= 0) {
            ctx.save();
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.02);
            ctx.fillStyle   = '#ff0000';
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2 - 4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    hit(dmg) {
        this.hp -= (dmg || 1);
        if (this.hp <= 0) return explode(this, 250, '#ff6600');
        // Toujours passer en mode combat si touché
        if (this.state === 'patrol') {
            this.spotted = true;
            this.state   = 'combat';
            this.burstCount = 3;
            this.shootTimer = 20;
            spawnText(this.x + this.width / 2, this.y - 28, '!!', '#ff0000', 14);
        }
        screenShake(4);
        for (let i = 0; i < 4; i++) particles.push(new Particle(
            this.x + this.width / 2, this.y + this.height / 2,
            (Math.random() - .5) * 6, (Math.random() - .5) * 6 - 2,
            '#ff6600', 20));
        return false;
    }
}

// ── BOSS ───────────────────────────────────────────
class EnemyBoss {
    constructor(x) {
        this.x = x; this.y = GROUND_Y - 110;
        this.width = 80; this.height = 110;
        this.vx = -1.0;
        this.hp = 30; this.maxHp = 30;
        this.type = 'boss';
        this.phase = 1;
        this.shootTimer = 60;
        this.chargeTimer = 0;
        this.charging = false;
        this.t = 0;
        this.frame = 0;
        this.frameTimer = 0;
        this._announced = false;
    }
    update(playerX, playerY) {
        this.t += 0.04;
        this.frameTimer++;
        if (this.frameTimer % 10 === 0) this.frame = (this.frame + 1) % 2;

        const dist = playerX - this.x;
        const phase = this.hp > 20 ? 1 : this.hp > 10 ? 2 : 3;
        this.phase = phase;

        // Annonce boss
        if (!this._announced) {
            this._announced = true;
            spawnText(this.x, this.y - 40, '⚠ BOSS ⚠', '#ff0000', 22);
            screenShake(25);
        }

        // Mouvements boss
        if (this.charging) {
            this.x += this.facingLeft ? -12 : 12;
            this.chargeTimer--;
            if (this.chargeTimer <= 0) { this.charging = false; }
        } else {
            const targetVX = phase >= 2 ? -1.8 : -1.0;
            this.vx += (targetVX - this.vx) * 0.05;
            this.x += this.vx;
            // Charge si près du joueur
            if (Math.abs(dist) < 200 && phase >= 2 && Math.random() < 0.005) {
                this.charging = true;
                this.chargeTimer = 18;
                this.facingLeft = dist < 0;
            }
        }

        // Tir
        this.shootTimer--;
        const shotInterval = phase === 1 ? 90 : phase === 2 ? 60 : 40;
        if (this.shootTimer <= 0 && this.x > playerX - 700) {
            this.shootTimer = shotInterval;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const dx = playerX - cx, dy = playerY - cy;
            const len = Math.sqrt(dx * dx + dy * dy);

            if (phase === 3) {
                // Tir en éventail
                for (let a = -2; a <= 2; a++) {
                    const angle = Math.atan2(dy, dx) + a * 0.25;
                    enemyBullets.push(new EnemyBullet(cx, cy, Math.cos(angle)*8, Math.sin(angle)*8, '#ff2200'));
                }
            } else {
                enemyBullets.push(new EnemyBullet(cx, cy, (dx/len)*8, (dy/len)*8, '#ff2200'));
                if (phase === 2) {
                    // Tir double
                    enemyBullets.push(new EnemyBullet(cx, cy + 20, (dx/len)*7, (dy/len)*7, '#ff4400'));
                }
            }
        }
    }
    draw() {
        const legSwing = this.frame === 0 ? 6 : -6;
        const hpPct = this.hp / this.maxHp;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Aura rouge phase 3
        if (this.phase === 3) {
            ctx.save();
            ctx.globalAlpha = 0.15 + 0.1 * Math.sin(this.t * 5);
            ctx.fillStyle = '#ff0000';
            ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Ombre sol
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-this.width / 2 + 5, this.height / 2 - 10, this.width - 10, 14);

        const legColor = this.phase >= 2 ? '#660000' : '#440000';
        ctx.fillStyle = legColor;
        ctx.fillRect(-24, 24, 20, 32 + legSwing);
        ctx.fillRect(4,   24, 20, 32 - legSwing);

        // Corps massif
        const bodyColor = this.phase === 3 ? '#ff1100' : this.phase === 2 ? '#cc0000' : '#990000';
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-36, -18, 72, 46);

        // Armure épaule
        ctx.fillStyle = this.phase >= 2 ? '#ff4400' : '#880000';
        ctx.fillRect(-46, -14, 16, 28);
        ctx.fillRect( 30, -14, 16, 28);

        // Tête
        ctx.fillStyle = '#880000';
        ctx.fillRect(-26, -46, 52, 34);
        // Yeux brillants
        const eyeColor = this.phase === 3 ? '#ff0000' : this.phase === 2 ? '#ff8800' : '#ffff00';
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor; ctx.shadowBlur = 12;
        ctx.fillRect(-18, -40, 10, 10);
        ctx.fillRect(  8, -40, 10, 10);
        ctx.shadowBlur = 0;

        // Canon (bras gauche)
        ctx.fillStyle = '#555';
        ctx.fillRect(-56, -8, 22, 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(-66, -7, 12, 8);
        // Canon 2 phase 2+
        if (this.phase >= 2) {
            ctx.fillStyle = '#555'; ctx.fillRect(34, -8, 22, 10);
            ctx.fillStyle = '#333'; ctx.fillRect(54, -7, 12, 8);
        }

        ctx.restore();

        // Barre de vie boss (en haut de l'écran dans le monde, mais on la dessine ici en coords monde)
        const barW = 200, barH = 10;
        const barX = this.x + this.width / 2 - barW / 2;
        const barY = this.y - 28;
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        const barCol = hpPct > 0.6 ? '#ff4400' : hpPct > 0.3 ? '#ff8800' : '#ff0000';
        ctx.fillStyle = barCol;
        ctx.fillRect(barX, barY, barW * hpPct, barH);
        ctx.strokeStyle = '#ff2200'; ctx.lineWidth = 1.5; ctx.strokeRect(barX, barY, barW, barH);
        ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('BOSS — ' + this.hp + '/' + this.maxHp, barX + barW / 2, barY - 4);
    }
    hit(dmg) {
        this.hp -= (dmg || 1);
        if (this.hp <= 0) return explode(this, 2000, '#ff2200');
        screenShake(this.phase >= 3 ? 8 : 5);
        for (let i = 0; i < 8; i++) particles.push(new Particle(this.x+this.width/2, this.y+this.height/2, (Math.random()-.5)*9, (Math.random()-.5)*9-3, '#ff4400', 30));
        return false;
    }
}

// ── Décor fond ─────────────────────────────────────
const bgLayers = [];
const bgStars = [];
(function buildBg() {
    for (let i = 0; i < 80; i++) {
        bgStars.push({ x: Math.random() * 4000, y: Math.random() * (GAME_HEIGHT * 0.55), size: Math.random() * 2 + 0.5, twinkle: Math.random() * Math.PI * 2 });
    }
    for (let i = 0; i < 12; i++) bgLayers.push({ type: 'mtn', x: i * 220, w: 180 + Math.random() * 120, h: 140 + Math.random() * 100, spd: 0.08 });
    for (let i = 0; i < 18; i++) bgLayers.push({ type: 'bld', x: i * 160 + Math.random() * 60, w: 60 + Math.random() * 80, h: 80 + Math.random() * 140, spd: 0.25 });
})();

function drawBackground() {
    // Ciel gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0,   '#0a0312');
    sky.addColorStop(0.4, '#3a0e00');
    sky.addColorStop(1,   '#aa3300');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Étoiles
    for (const s of bgStars) {
        s.twinkle += 0.02;
        const alpha = 0.4 + 0.4 * Math.sin(s.twinkle);
        const lx = ((s.x - cameraX * 0.02) % (GAME_WIDTH + 400) + (GAME_WIDTH + 400)) % (GAME_WIDTH + 400);
        ctx.fillStyle = `rgba(255,220,180,${alpha})`;
        ctx.fillRect(lx, s.y, s.size, s.size);
    }

    // Soleil couchant
    ctx.save();
    ctx.globalAlpha = 0.5;
    const sunGrad = ctx.createRadialGradient(GAME_WIDTH * 0.65, GAME_HEIGHT * 0.35, 0, GAME_WIDTH * 0.65, GAME_HEIGHT * 0.35, 120);
    sunGrad.addColorStop(0, '#ffee00'); sunGrad.addColorStop(0.4, '#ff6600'); sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();

    // Montagnes
    ctx.save();
    for (const l of bgLayers.filter(l => l.type === 'mtn')) {
        const lx = ((l.x - cameraX * l.spd) % (GAME_WIDTH + 400) + (GAME_WIDTH + 400)) % (GAME_WIDTH + 400) - 200;
        ctx.fillStyle = 'rgba(30,8,0,0.7)';
        ctx.beginPath(); ctx.moveTo(lx, GROUND_Y - 30); ctx.lineTo(lx + l.w / 2, GROUND_Y - 30 - l.h); ctx.lineTo(lx + l.w, GROUND_Y - 30); ctx.fill();
    }
    ctx.restore();

    // Bâtiments
    ctx.save();
    for (const l of bgLayers.filter(l => l.type === 'bld')) {
        const lx = ((l.x - cameraX * l.spd) % (GAME_WIDTH + 600) + (GAME_WIDTH + 600)) % (GAME_WIDTH + 600) - 200;
        ctx.fillStyle = 'rgba(12,4,0,0.85)'; ctx.fillRect(lx, GROUND_Y - 20 - l.h, l.w, l.h);
        ctx.fillStyle = 'rgba(255,180,50,0.25)';
        for (let wy = 8; wy < l.h - 16; wy += 20) for (let wx = 8; wx < l.w - 10; wx += 18)
            if (Math.random() > 0.35) ctx.fillRect(lx + wx, GROUND_Y - 20 - l.h + wy, 8, 10);
    }
    ctx.restore();

    // Sol
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    groundGrad.addColorStop(0, '#3d1a00'); groundGrad.addColorStop(1, '#1a0800');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-cameraX - 200, GROUND_Y, GAME_WIDTH * 20, GAME_HEIGHT - GROUND_Y);
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(-cameraX - 200, GROUND_Y); ctx.lineTo(-cameraX + GAME_WIDTH * 20, GROUND_Y); ctx.stroke();
    ctx.globalAlpha = 1;
}

// ── Inputs ─────────────────────────────────────────
const keys = {};
let jumpPressed = false;

window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (!keys[k]) {
        if (k === 'w' || k === 'arrowup' || k === ' ') jumpPressed = true;
    }
    keys[k] = true; keys[e.key] = true;
    // Empêcher le scroll sur F et espace
    if (e.key === ' ' || e.key === 'f' || e.key === 'F') e.preventDefault();
    // Pendant le jeu, espace = saut uniquement (géré par jumpPressed)
    // Menu / GameOver : délégué au script HTML inline
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; keys[e.key] = false; });

// ── Init ───────────────────────────────────────────
const player = new Player();
let enemySpawnTimer = 0;
let enemySpawnRate  = 140;
let bossSpawned     = false;
let nextBossScore   = 2000;

ensurePlatforms();

// ── Boucle principale ─────────────────────────────
function gameLoop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const scale   = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    const offsetX = (window.innerWidth  - GAME_WIDTH  * scale) / 2 + shakeX;
    const offsetY = (window.innerHeight - GAME_HEIGHT * scale) / 2 + shakeY;

    shakeX *= 0.85; shakeY *= 0.85;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-cameraX, 0);

    drawBackground();

    if (!isGameOver && gameState === 'playing') {
        gameTime++;
        const diffMult = { FACILE: 0.6, NORMAL: 1.0, DIFFICILE: 1.5, BRUTAL: 2.2 }[difficulty] || 1.0;
        enemySpawnRate = Math.max(30, (140 - Math.floor(gameTime / 300) * 8) / diffMult);

        // Spawn ennemis
        enemySpawnTimer++;
        if (enemySpawnTimer >= enemySpawnRate) {
            enemySpawnTimer = 0;
            const r = Math.random();
            const spawnX = cameraX + GAME_WIDTH + 80 + Math.random() * 150;
            if      (r < 0.40) enemies.push(new EnemyBasic(spawnX));
            else if (r < 0.60) enemies.push(new EnemyHeavy(spawnX));
            else if (r < 0.80) enemies.push(new EnemyFlying(spawnX));
            else               enemies.push(new EnemyShooter(spawnX));
        }

        // Boss spawn
        if (!bossSpawned && score >= nextBossScore) {
            bossSpawned = true;
            enemies.push(new EnemyBoss(cameraX + GAME_WIDTH + 200));
        }
        // Reset boss flag quand boss mort
        if (bossSpawned && !enemies.some(e => e.type === 'boss')) {
            bossSpawned = false;
            nextBossScore = score + 3000;
            spawnText(cameraX + GAME_WIDTH / 2, GROUND_Y - 160, 'BOSS DEFEATED!', '#ff8800', 18);
        }

        // Combo decay
        if (comboTimer > 0) comboTimer--; else if (combo > 0) combo = 0;

        // Plateformes
        ensurePlatforms();
        for (let i = platforms.length - 1; i >= 0; i--) {
            if (platforms[i].update()) platforms.splice(i, 1);
            else platforms[i].draw();
        }

        player.update();
        player.draw();

        // Spawn ammo automatique fréquent
        ammoSpawnTimer++;
        if (ammoSpawnTimer >= 280) {
            ammoSpawnTimer = 0;
            spawnPowerUp(cameraX + GAME_WIDTH + 60 + Math.random() * 200, GROUND_Y - 60, true);
        }

        // Balles joueur vs ennemis
        bullets_loop:
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i]; b.update(); b.draw();
            if (b.x < cameraX - 100 || b.x > cameraX + GAME_WIDTH + 100 || b.life <= 0 || b.y > GROUND_Y) { bullets.splice(i, 1); continue; }
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                    if (e.hit(b.damage || 1)) enemies.splice(j, 1);
                    bullets.splice(i, 1);
                    continue bullets_loop;
                }
            }
        }

        // Rockets joueur
        for (let i = rocketBullets.length - 1; i >= 0; i--) {
            const r = rocketBullets[i]; r.update(); r.draw();
            if (r.x < cameraX - 100 || r.x > cameraX + GAME_WIDTH + 200 || r.life <= 0 || r.y > GROUND_Y) {
                r.explodeAt(r.x + r.width / 2, r.y + r.height / 2);
                rocketBullets.splice(i, 1); continue;
            }
            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (r.x < e.x + e.width && r.x + r.width > e.x && r.y < e.y + e.height && r.y + r.height > e.y) {
                    r.explodeAt(r.x + r.width / 2, r.y + r.height / 2);
                    rocketBullets.splice(i, 1); hit = true; break;
                }
            }
            if (hit) continue;
        }

        // Balles ennemies vs joueur
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i]; b.update(); b.draw();
            if (b.x < cameraX - 80 || b.x > cameraX + GAME_WIDTH + 80 || b.life <= 0 || b.y > GROUND_Y + 40) { enemyBullets.splice(i, 1); continue; }
            const p = player;
            if (b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y) {
                player.hit(15);
                spawnText(p.x + p.width/2, p.y - 10, '-15', '#ff4444', 12);
                for (let k = 0; k < 5; k++) particles.push(new Particle(b.x, b.y, (Math.random()-.5)*6, (Math.random()-.5)*6, '#ff4444', 18));
                enemyBullets.splice(i, 1);
                continue;
            }
        }

        // Ennemis
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.type === 'shooter') e.update(player.x + player.width / 2, player.y + player.height / 2);
            else if (e.type === 'boss') e.update(player.x + player.width / 2, player.y + player.height / 2);
            else e.update();
            e.draw();
            // Contact joueur
            if (e.x < player.x + player.width && e.x + e.width > player.x &&
                e.y < player.y + player.height && e.y + e.height > player.y) {
                const dmg = e.type === 'boss' ? 40 : e.type === 'heavy' ? 30 : 20;
                player.hit(dmg);
                if (e.type !== 'boss') enemies.splice(i, 1);
                continue;
            }
            if (e.x + e.width < cameraX - 60) enemies.splice(i, 1);
        }

        // Power-ups
        for (let i = powerups.length - 1; i >= 0; i--) {
            if (powerups[i].update()) powerups.splice(i, 1);
            else powerups[i].draw();
        }

        // Explosion flashes (monde)
        for (let i = explosionFlashes.length - 1; i >= 0; i--) {
            const f = explosionFlashes[i];
            const alpha = f.life / f.maxLife * 0.6;
            ctx.save();
            ctx.globalAlpha = alpha;
            const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * (1 - f.life / f.maxLife + 0.3));
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, f.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            f.life--;
            if (f.life <= 0) explosionFlashes.splice(i, 1);
        }

        // Particules
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(); particles[i].draw();
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        // Floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const t = floatingTexts[i]; t.y += t.vy; t.life--;
            if (t.life <= 0) { floatingTexts.splice(i, 1); continue; }
        }
        drawFloatingText(floatingTexts);
    }

    ctx.restore();

    // HUD hors caméra
    if (gameState === 'playing') {
        drawUI(player.health, player.maxHealth, player.ammo, player.maxAmmo, score, combo, player.shieldTimer, player.rapidTimer, player._emptyTimer || 0, player.weapon);
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    isGameOver = false;
    score = 0; cameraX = 0; gameTime = 0; combo = 0; comboTimer = 0;
    bullets = []; rocketBullets = []; enemyBullets = []; enemies = [];
    particles = []; floatingTexts = []; platforms = []; powerups = [];
    explosionFlashes = []; bossSpawned = false; nextBossScore = 2000;
    ammoSpawnTimer = 0;
    player.reset();
    ensurePlatforms();
}

function restartGame() {
    isGameOver = false;
    gameState = 'playing';
    score = 0; cameraX = 0; gameTime = 0; combo = 0; comboTimer = 0;
    bullets = []; rocketBullets = []; enemyBullets = []; enemies = [];
    particles = []; floatingTexts = []; platforms = []; powerups = [];
    explosionFlashes = []; bossSpawned = false; nextBossScore = 2000;
    ammoSpawnTimer = 0;
    player.reset();
    ensurePlatforms();
}

gameLoop();