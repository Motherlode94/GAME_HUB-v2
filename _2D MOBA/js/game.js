// ═══════════════════════════════════════════════════════════
//  CANVAS
// ═══════════════════════════════════════════════════════════
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

let mouseHasMoved = false;
let mouseX = window.innerWidth  / 2;
let mouseY = window.innerHeight / 2;

function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!mouseHasMoved) {
        mouseX = canvas.width  / 2;
        mouseY = canvas.height / 2;
    }
}
resize();
window.addEventListener("resize", resize);

// ═══════════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════════
let gameState = "playing"; // "playing" | "wave_complete" | "shopping" | "game_over"
let wave      = 1;
let score     = 0;
let gold      = 0;
let totalGoldEarned  = 0;
let waveAnnounceTimer = 0;
let spawnQueue = [];
let spawnTimer = 0;

// ═══════════════════════════════════════════════════════════
//  OBJECTS
// ═══════════════════════════════════════════════════════════
const keys = {};

const player      = new Player();
const enemies     = [];
const projectiles = [];
const aoes        = [];
const towers      = [
    new Tower(300, 180),
    new Tower(300, window.innerHeight - 230)
];

// ═══════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════
document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["a","z","e","r"].includes(k) && gameState === "playing") {
        player.castSpell(k, mouseX, mouseY, projectiles, aoes);
    }
});
document.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseHasMoved = true;
});

// ═══════════════════════════════════════════════════════════
//  WAVE BUILDER
// ═══════════════════════════════════════════════════════════
function buildWave(n) {
    const q   = [];
    const add = (type, count, baseDelay, interval) => {
        for (let i = 0; i < count; i++) q.push({
            type, delay: baseDelay + i * interval,
            x: canvas.width + 60,
            y: 55 + Math.random() * (canvas.height - 130)
        });
    };
    add("grunt", 3 + n * 2,          0,   40);
    if (n >= 2) add("scout", n,           50,  28);
    if (n >= 3) add("tank",  Math.ceil(n / 2), 100, 100);
    if (n >= 5) add("brute", Math.ceil(n / 3), 80,  70);
    return q.sort((a, b) => a.delay - b.delay);
}

function launchWave() {
    spawnQueue = buildWave(wave);
    spawnTimer = 0;
    waveAnnounceTimer = 130;
    gameState = "playing";
}

// ═══════════════════════════════════════════════════════════
//  SHOP
// ═══════════════════════════════════════════════════════════
const SHOP_ITEMS = [
    { icon:"💊", name:"HP RESTORE",    desc:"Restore 30 HP",           cost:20, action:p => { p.hp = Math.min(p.maxHp, p.hp + 30); } },
    { icon:"🔷", name:"MANA CRYSTAL",  desc:"+50 mana + regen boost",  cost:25, action:p => { p.mana = Math.min(p.maxMana, p.mana + 50); p.manaRegen += 0.06; } },
    { icon:"⚡", name:"SPEED BOOST",   desc:"+0.5 movement speed",     cost:30, action:p => { p.speed += 0.5; } },
    { icon:"🟡", name:"UPGRADE A",     desc:`+5 dmg, Spell A`,         cost:25, action:p => { p.spellLevels.a++; } },
    { icon:"🔵", name:"UPGRADE Z",     desc:`+12 dmg, Spell Z`,        cost:35, action:p => { p.spellLevels.z++; } },
    { icon:"🟢", name:"UPGRADE E",     desc:`+3 dmg, Spell E`,         cost:22, action:p => { p.spellLevels.e++; } },
    { icon:"🔴", name:"UPGRADE R",     desc:`+18 dmg, AoE R`,          cost:48, action:p => { p.spellLevels.r++; } },
    { icon:"🛡️", name:"FORTIFY",       desc:"+25 max HP",              cost:55, action:p => { p.maxHp += 25; p.hp += 25; } },
    { icon:"🏰", name:"TOWER UPGRADE", desc:"+0.5 dmg per tower",      cost:40, action:() => { towers.forEach(t => t.damage += 0.5); } },
];

function openShop() {
    gameState = "shopping";
    document.getElementById("shop-gold").textContent  = gold;
    document.getElementById("shop-wave").textContent  = wave;
    document.getElementById("shop-score").textContent = score.toLocaleString();
    document.getElementById("next-wave-num").textContent = wave + 1;
    renderShopItems();
    document.getElementById("shop").classList.add("visible");
}

function renderShopItems() {
    const grid = document.getElementById("shop-grid");
    grid.innerHTML = "";
    SHOP_ITEMS.forEach(item => {
        const canAfford = gold >= item.cost;
        const el = document.createElement("div");
        el.className = "shop-item" + (canAfford ? "" : " cant-afford");
        el.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.desc}</div>
            <div class="item-cost">💰 ${item.cost}</div>`;
        if (canAfford) {
            el.onclick = () => {
                gold -= item.cost;
                item.action(player);
                document.getElementById("shop-gold").textContent = gold;
                renderShopItems();
            };
        }
        grid.appendChild(el);
    });
}

function startNextWave() {
    document.getElementById("shop").classList.remove("visible");
    wave++;
    launchWave();
}

// ═══════════════════════════════════════════════════════════
//  GAME OVER
// ═══════════════════════════════════════════════════════════
function triggerGameOver() {
    gameState = "game_over";
    document.getElementById("gameover-stats").innerHTML = `
        WAVES SURVIVED: <span>${wave}</span><br>
        FINAL SCORE: <span>${score.toLocaleString()}</span><br>
        GOLD EARNED: <span>${totalGoldEarned}</span>`;
    document.getElementById("gameover").classList.add("visible");
}

function restartGame() {
    document.getElementById("gameover").classList.remove("visible");
    wave = 1; score = 0; gold = 0; totalGoldEarned = 0;
    enemies.length = 0;
    projectiles.length = 0;
    aoes.length = 0;
    particles.length = 0;
    towers.length = 0;
    towers.push(new Tower(300, 180));
    towers.push(new Tower(300, canvas.height - 230));
    player.x = 200; player.y = canvas.height / 2;
    // Full reset via constructor properties
    Object.assign(player, new Player());
    launchWave();
}

// ═══════════════════════════════════════════════════════════
//  BACKGROUND
// ═══════════════════════════════════════════════════════════
function drawBackground() {
    ctx.fillStyle = "#020610";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(0,255,255,0.028)";
    ctx.lineWidth = 1;
    const g = 55;
    for (let x = 0; x < canvas.width; x += g) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += g) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════════════════════
function drawHUD() {
    ctx.save();

    // ── Top bar ──────────────────────────────────────────
    ctx.fillStyle = "rgba(2,6,16,0.82)";
    ctx.fillRect(0, 0, canvas.width, 48);
    ctx.strokeStyle = "rgba(0,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, 48);

    ctx.font = "bold 13px 'Orbitron', monospace";
    ctx.textBaseline = "middle";

    ctx.shadowBlur  = 12; ctx.shadowColor = "#00ffff";
    ctx.fillStyle   = "#00ffff";
    ctx.fillText(`WAVE ${wave}`, 18, 24);

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = "rgba(255,255,255,0.8)";
    ctx.fillText(`SCORE  ${score.toLocaleString()}`, 150, 24);

    const alive = enemies.length + spawnQueue.length;
    ctx.fillStyle   = "#ff6600";
    ctx.shadowBlur  = 6; ctx.shadowColor = "#ff6600";
    ctx.fillText(`☠ ${alive}`, canvas.width / 2 - 20, 24);

    ctx.shadowBlur  = 10; ctx.shadowColor = "#ffd700";
    ctx.fillStyle   = "#ffd700";
    ctx.textAlign   = "right";
    ctx.fillText(`💰  ${gold}`, canvas.width - 18, 24);
    ctx.textAlign   = "left";
    ctx.shadowBlur  = 0;

    // ── Bottom spell bar ─────────────────────────────────
    const bH = 62, bY = canvas.height - bH;
    ctx.fillStyle = "rgba(2,6,16,0.88)";
    ctx.fillRect(0, bY, canvas.width, bH);
    ctx.strokeStyle = "rgba(0,255,255,0.1)";
    ctx.strokeRect(0, bY, canvas.width, bH);

    // HP / Mana bars (left)
    const barW = 160, lx = 18, ly = bY + 10;
    ctx.font = "10px 'Orbitron', monospace";
    ctx.textBaseline = "top";

    ctx.fillStyle = "#445566"; ctx.fillText("HP", lx, ly);
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(lx + 28, ly, barW, 14);
    ctx.shadowBlur = 5; ctx.shadowColor = "#ff3355";
    ctx.fillStyle  = "#ff3355";
    ctx.fillRect(lx + 28, ly, barW * Math.max(0, player.hp / player.maxHp), 14);
    ctx.font = "8px 'Orbitron', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, lx + 32, ly + 3);

    ctx.font = "10px 'Orbitron', monospace";
    ctx.shadowBlur = 0;
    ctx.fillStyle  = "#445566"; ctx.fillText("MP", lx, ly + 24);
    ctx.fillStyle  = "rgba(0,0,0,0.55)"; ctx.fillRect(lx + 28, ly + 24, barW, 14);
    ctx.shadowBlur = 5; ctx.shadowColor = "#4466ff";
    ctx.fillStyle  = "#4466ff";
    ctx.fillRect(lx + 28, ly + 24, barW * (player.mana / player.maxMana), 14);
    ctx.font = "8px 'Orbitron', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${Math.ceil(player.mana)} / ${player.maxMana}`, lx + 32, ly + 27);
    ctx.shadowBlur = 0;

    // Spell slots (center)
    const spells = [
        { key:"a", col:"#ffdd00", maxCd:30  },
        { key:"z", col:"#4488ff", maxCd:90  },
        { key:"e", col:"#00ff88", maxCd:15  },
        { key:"r", col:"#ff4400", maxCd:180 },
    ];
    const costs = Player.MANA_COSTS;
    const sw  = 72, sh = bH - 12;
    const sx0 = canvas.width / 2 - (spells.length * sw) / 2;

    spells.forEach((sp, i) => {
        const sx     = sx0 + i * sw;
        const sy     = bY + 6;
        const cd     = player.cooldowns[sp.key];
        const onCD   = cd > 0;
        const noMana = player.mana < costs[sp.key];
        const locked = onCD || noMana;

        ctx.fillStyle   = locked ? "rgba(0,0,0,0.45)" : `${sp.col}18`;
        ctx.fillRect(sx, sy, sw - 6, sh);
        ctx.strokeStyle = locked ? "rgba(255,255,255,0.12)" : sp.col;
        ctx.lineWidth   = locked ? 1 : 1.5;
        ctx.strokeRect(sx, sy, sw - 6, sh);

        // Cooldown fill
        if (onCD) {
            const frac = cd / sp.maxCd;
            ctx.fillStyle = `${sp.col}28`;
            ctx.fillRect(sx, sy + sh * (1 - frac), sw - 6, sh * frac);
        }

        // Key letter
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.font         = "bold 17px 'Orbitron', monospace";
        ctx.fillStyle    = locked ? "rgba(255,255,255,0.2)" : "#fff";
        ctx.shadowBlur   = locked ? 0 : 14;
        ctx.shadowColor  = sp.col;
        ctx.fillText(sp.key.toUpperCase(), sx + (sw - 6) / 2, sy + sh * 0.42);

        // Level badge
        ctx.font      = "8px 'Orbitron', monospace";
        ctx.shadowBlur = 0;
        ctx.fillStyle  = sp.col;
        ctx.fillText(`Lv${player.spellLevels[sp.key]}`, sx + (sw - 6) / 2, sy + sh - 7);

        ctx.textAlign    = "left";
        ctx.textBaseline = "alphabetic";
        ctx.shadowBlur   = 0;
    });

    ctx.restore();
}

// ═══════════════════════════════════════════════════════════
//  WAVE ANNOUNCEMENT OVERLAY
// ═══════════════════════════════════════════════════════════
function drawAnnounce() {
    if (waveAnnounceTimer <= 0) return;
    const fadeIn  = Math.min(1, (130 - waveAnnounceTimer) / 20);
    const fadeOut = Math.min(1, waveAnnounceTimer / 35);
    const alpha   = Math.min(fadeIn, fadeOut);

    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.font        = "bold 80px 'Orbitron', monospace";
    ctx.shadowBlur  = 50; ctx.shadowColor = "#00ffff";
    ctx.fillStyle   = "#00ffff";
    ctx.fillText(`WAVE ${wave}`, canvas.width / 2, canvas.height / 2 - 10);

    ctx.font        = "18px 'Orbitron', monospace";
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = "rgba(0,200,220,0.7)";
    ctx.fillText("PREPARE FOR BATTLE", canvas.width / 2, canvas.height / 2 + 55);

    ctx.textAlign    = "left";
    ctx.textBaseline = "alphabetic";
    ctx.restore();
    waveAnnounceTimer--;
}

// ═══════════════════════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════════════════════
function update() {
    if (gameState !== "playing") return;

    // Spawn enemies from queue
    spawnTimer++;
    while (spawnQueue.length && spawnQueue[0].delay <= spawnTimer) {
        const e = spawnQueue.shift();
        enemies.push(new Enemy(e.x, e.y, e.type));
    }

    // Player
    player.move(keys);
    player.updateCooldowns(mouseX, mouseY);
    if (player.hp <= 0) { triggerGameOver(); return; }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(player);
        if (enemies[i].hp <= 0) {
            const e = enemies[i];
            burst(e.x + e.width / 2, e.y + e.height / 2, e.color, 18, 5, 5);
            gold            += e.gold;
            totalGoldEarned += e.gold;
            score           += e.score * wave;
            enemies.splice(i, 1);
        }
    }

    // Wave cleared?
    if (spawnQueue.length === 0 && enemies.length === 0) {
        score += wave * 50;
        gameState = "wave_complete";
        setTimeout(openShop, 700);
    }

    // Towers
    towers.forEach(t => t.update(enemies, projectiles));

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(enemies);
        if (projectiles[i].life <= 0) projectiles.splice(i, 1);
    }

    // AoEs
    for (let i = aoes.length - 1; i >= 0; i--) {
        aoes[i].update(enemies);
        if (aoes[i].duration <= 0) aoes.splice(i, 1);
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

// ═══════════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════════
function draw() {
    drawBackground();
    towers.forEach(t => t.draw(ctx));
    aoes.forEach(a => a.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    player.draw(ctx);
    particles.forEach(p => p.draw(ctx));
    drawHUD();
    drawAnnounce();
}

// ═══════════════════════════════════════════════════════════
//  LOOP + START
// ═══════════════════════════════════════════════════════════
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

launchWave();
gameLoop();