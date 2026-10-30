let enemies = [];

// speed en pixels/seconde
const ENEMY_TYPES = {
    BASIC:   { name: 'Soldat',  color: '#e74c3c', speed: 55, hp: 90,   armor: 0, reward: 6,   score: 10,  size: 20, lives: 1,  shape: 'square' },
    GUNNER:  { name: 'Tireur', color: '#bf4343', speed: 48, hp: 105, armor: 1, reward: 10, score: 22, size: 20, lives: 1, shape: 'hex', range: 165, fireRate: 1300, damage: 12 },
    ROCKET:  { name: 'Lance-roquettes', color: '#ab623e', speed: 34, hp: 135, armor: 2, reward: 17, score: 36, size: 23, lives: 1, shape: 'diamond', range: 190, fireRate: 2700, damage: 29 },
    FAST:    { name: 'Coureur', color: '#ff4fb0', speed: 95, hp: 55,   armor: 0, reward: 7,   score: 15,  size: 16, lives: 1,  shape: 'diamond' },
    SWARM:   { name: 'Essaim',  color: '#f1c40f', speed: 75, hp: 28,   armor: 0, reward: 2,   score: 4,   size: 12, lives: 1,  shape: 'circle' },
    ARMORED: { name: 'Blindé',  color: '#95a5a6', speed: 45, hp: 170,  armor: 8, reward: 12,  score: 30,  size: 22, lives: 1,  shape: 'hex' },
    TANK:    { name: 'Tank',    color: '#8d5524', speed: 35, hp: 360,  armor: 3, reward: 15,  score: 40,  size: 26, lives: 2,  shape: 'square' },
    BOSS:    { name: 'Boss',    color: '#ff6600', speed: 30, hp: 2400, armor: 5, reward: 120, score: 400, size: 34, lives: 10, shape: 'star' }
};

// Composition d'une vague : groupes successifs { type, count, delay }
function buildWaveGroups(wave) {
    const groups = [];
    const add = (type, count, delay) => {
        if (count > 0) groups.push({ type, count, delay });
    };

    add('BASIC', 6 + Math.floor(wave * 1.5), 750);
    if (wave >= 2) add('GUNNER', Math.min(9, 1 + Math.floor(wave / 2)), 1100);
    if (wave >= 5) add('ROCKET', Math.min(6, Math.floor(wave / 4)), 1650);
    if (wave >= 3) add('FAST', Math.floor((wave - 1) * 0.9), 450);
    if (wave >= 4 && wave % 2 === 0) add('SWARM', 8 + wave, 170);
    if (wave >= 6) add('ARMORED', Math.floor((wave - 4) * 0.6), 1100);
    if (wave >= 8) add('TANK', Math.floor((wave - 6) * 0.5), 1400);
    if (wave % 10 === 0) add('BOSS', Math.floor(wave / 10), 2500);
    else if (wave % 5 === 0) add('TANK', 2 + Math.floor(wave / 10), 1600);

    return groups;
}

function buildWaveQueue(wave) {
    const queue = [];
    buildWaveGroups(wave).forEach((group) => {
        for (let i = 0; i < group.count; i++) {
            queue.push({ type: group.type, delay: i === 0 ? 1500 : group.delay });
        }
    });
    if (queue.length) queue[0].delay = 0;
    return queue;
}

function getWavePreview(wave) {
    const counts = {};
    buildWaveGroups(wave).forEach((g) => {
        counts[g.type] = (counts[g.type] || 0) + g.count;
    });
    return counts;
}

function spawnEnemy(typeKey, wave) {
    const t = ENEMY_TYPES[typeKey] || ENEMY_TYPES.BASIC;
    const w = Math.max(0, wave - 1);
    const hpMultiplier = (1 + w * 0.18) * Math.pow(1.035, w);
    const speedMultiplier = Math.min(1.5, 1 + w * 0.012);
    // Bosses use a dedicated, predictable curve (wave 10 = 1800 HP).
    // The generic exponential multiplier made the first boss excessively tanky.
    const hp = typeKey === 'BOSS'
        ? Math.round(1800 * (1 + Math.max(0, wave - 10) * 0.055))
        : Math.round(t.hp * hpMultiplier);
    const start = pathWaypoints[0];

    enemies.push({
        x: start.x,
        y: start.y,
        type: typeKey,
        name: t.name,
        color: t.color,
        shape: t.shape,
        size: t.size,
        speed: t.speed * speedMultiplier,
        maxLife: hp,
        life: hp,
        armor: t.armor ? Math.round(t.armor * (1 + w * 0.05)) : 0,
        reward: Math.round(t.reward * (1 + w * 0.06)),
        scoreValue: t.score + w * 3,
        livesCost: t.lives,
        isBoss: typeKey === 'BOSS',
        waypoint: 1,
        traveled: 0,
        slowFactor: 1,
        slowTimer: 0,
        hitFlash: 0,
        fireTimer: Math.random() * 800,
        wobble: Math.random() * Math.PI * 2
    });
}

function damageEnemy(enemy, amount, tower, pierceArmor = false) {
    if (!enemy || enemy.life <= 0) return 0;
    const effective = pierceArmor ? amount : Math.max(amount * 0.25, amount - enemy.armor);
    enemy.life -= effective;
    enemy.hitFlash = 80;
    if (tower) {
        tower.damageDealt += Math.min(effective, Math.max(0, enemy.life + effective));
        if (enemy.life <= 0) tower.kills += 1;
    }
    return effective;
}

function applySlow(enemy, factor, duration) {
    if (!enemy || enemy.life <= 0) return;
    const resisted = enemy.isBoss ? Math.max(factor, 0.75) : factor;
    enemy.slowFactor = Math.min(enemy.slowFactor, resisted);
    enemy.slowTimer = Math.max(enemy.slowTimer, duration);
}

function updateEnemies(dt) {
    enemies.forEach((enemy) => {
        if (enemy.slowTimer > 0) {
            enemy.slowTimer -= dt;
            if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
        }
        if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
        enemy.wobble += dt * 0.01;
        const shooter = ENEMY_TYPES[enemy.type];
        if (shooter.range && enemy.life > 0 && !enemy.reachedEnd && towers.length) {
            enemy.fireTimer = Math.max(0, enemy.fireTimer - dt);
            let target = null, best = shooter.range;
            towers.forEach((tower) => {
                if (tower.hp <= 0) return;
                const dist = distance(enemy.x, enemy.y, tower.x, tower.y);
                if (dist < best) { best = dist; target = tower; }
            });
            if (target && enemy.fireTimer <= 0) {
                enemy.fireTimer = shooter.fireRate;
                enemyProjectiles.push({ x: enemy.x, y: enemy.y, target, speed: enemy.type === 'ROCKET' ? 215 : 380,
                    damage: shooter.damage, color: enemy.type === 'ROCKET' ? '#ff9748' : '#ff5555' });
            }
        }

        let move = (enemy.speed * enemy.slowFactor * dt) / 1000;
        while (move > 0 && enemy.waypoint < pathWaypoints.length) {
            const target = pathWaypoints[enemy.waypoint];
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= move) {
                enemy.x = target.x;
                enemy.y = target.y;
                enemy.traveled += dist;
                move -= dist;
                enemy.waypoint += 1;
            } else {
                enemy.x += (dx / dist) * move;
                enemy.y += (dy / dist) * move;
                enemy.traveled += move;
                move = 0;
            }
        }
        if (enemy.waypoint >= pathWaypoints.length) enemy.reachedEnd = true;
    });

    enemies = enemies.filter((enemy) => {
        if (enemy.life <= 0) {
            gameState.money += enemy.reward;
            gameState.score += enemy.scoreValue;
            gameState.killCount += 1;
            createDeathParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 30 : 10);
            addFloatingText(enemy.x, enemy.y - 10, `+${enemy.reward}$`);
            return false;
        }
        if (enemy.reachedEnd) {
            loseLives(enemy.livesCost);
            return false;
        }
        return true;
    });
}

function traceEnemyShape(ctx, shape, size) {
    const r = size / 2;
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else if (shape === 'diamond') {
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
    } else if (shape === 'hex') {
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
    } else if (shape === 'star') {
        for (let i = 0; i < 10; i++) {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const rr = i % 2 === 0 ? r : r * 0.5;
            if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
            else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
    } else {
        ctx.rect(-r, -r, size, size);
    }
}

function drawEnemies(ctx) {
    enemies.forEach((enemy) => {
        const size = enemy.size;
        const bob = Math.sin(enemy.wobble) * 1.5;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + size / 2 + 2, size / 2, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(enemy.x, enemy.y + bob);
        if (enemy.isBoss) ctx.rotate(enemy.wobble * 0.2);
        traceEnemyShape(ctx, enemy.shape, size);
        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
        ctx.fill();
        ctx.lineWidth = enemy.armor > 0 ? 3 : 1.5;
        ctx.strokeStyle = enemy.isBoss ? '#ffd27a' : (enemy.armor > 0 ? '#2c3e50' : 'rgba(0,0,0,0.6)');
        ctx.stroke();

        if (enemy.slowFactor < 1) {
            ctx.strokeStyle = 'rgba(120, 220, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (enemy.type === 'GUNNER' || enemy.type === 'ROCKET') {
            ctx.strokeStyle = '#262626'; ctx.lineWidth = enemy.type === 'ROCKET' ? 6 : 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, 0); ctx.stroke();
        }
        ctx.restore();

        // Barre de vie (affichée dès que l'ennemi est touché, toujours pour les boss)
        if (enemy.life < enemy.maxLife || enemy.isBoss) {
            const barWidth = Math.max(20, size);
            const barY = enemy.y - size / 2 - 10;
            const pct = Math.max(0, enemy.life / enemy.maxLife);
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x - barWidth / 2, barY, barWidth, 4);
            ctx.fillStyle = pct > 0.6 ? '#2ecc71' : (pct > 0.3 ? '#f1c40f' : '#e74c3c');
            ctx.fillRect(enemy.x - barWidth / 2, barY, barWidth * pct, 4);
        }

        if (enemy.isBoss) {
            // Large readable boss health bar with exact remaining HP.
            const bw = 118, bx = enemy.x - bw / 2, by = enemy.y - size / 2 - 31;
            const pct = Math.max(0, Math.min(1, enemy.life / enemy.maxLife));
            ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(bx - 3, by - 5, bw + 6, 22);
            ctx.fillStyle = '#4e1515'; ctx.fillRect(bx, by, bw, 9);
            ctx.fillStyle = pct > .35 ? '#ff9f43' : '#ff4444';
            ctx.fillRect(bx, by, bw * pct, 9);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
            ctx.fillText(Math.ceil(Math.max(0, enemy.life)) + ' / ' + enemy.maxLife + ' PV', enemy.x, by + 18);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', enemy.x, enemy.y - size / 2 - 14);
            ctx.textAlign = 'left';
        }
    });
}

function getEnemiesInRange(x, y, range) {
    return enemies.filter((e) => e.life > 0 && !e.reachedEnd && distance(x, y, e.x, e.y) <= range);
}
