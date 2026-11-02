let projectiles = [];

function updateProjectiles(dt) {
    projectiles.forEach((p) => {
        // Les projectiles suivent leur cible ; si elle meurt, ils finissent leur course
        if (p.target && p.target.life > 0 && !p.target.reachedEnd) {
            p.tx = p.target.x;
            p.ty = p.target.y;
        }

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = (p.speed * dt) / 1000;

        if (dist <= step || dist < 3) {
            p.x = p.tx;
            p.y = p.ty;
            impactProjectile(p);
            p.done = true;
        } else {
            p.x += (dx / dist) * step;
            p.y += (dy / dist) * step;
        }
    });

    projectiles = projectiles.filter((p) => !p.done);
}

function impactProjectile(p) {
    if (p.splash) {
        getEnemiesInRange(p.x, p.y, p.splash).forEach((enemy) => {
            const dmg = enemy === p.target ? p.damage : p.damage * 0.7;
            damageEnemy(enemy, dmg, p.tower, !!p.pierce);
            if (p.slow) applySlow(enemy, p.slow.factor, p.slow.duration);
        });
        createExplosion(p.x, p.y, p.splash, p.slow ? 'rgba(130, 220, 255, 0.6)' : 'rgba(255, 140, 40, 0.6)');
    } else if (p.target && p.target.life > 0) {
        damageEnemy(p.target, p.damage, p.tower, !!p.pierce);
        if (p.slow) applySlow(p.target, p.slow.factor, p.slow.duration);
        createImpactEffect(p.x, p.y);
    }
}

function drawProjectiles(ctx) {
    projectiles.forEach((p) => {
        // Les obus de mortier décrivent un arc (hauteur simulée)
        let lift = 0;
        if (p.arc && p.startDist > 0) {
            const remaining = distance(p.x, p.y, p.tx, p.ty);
            const t = 1 - Math.min(1, remaining / p.startDist);
            lift = Math.sin(t * Math.PI) * Math.min(40, p.startDist * 0.3);
        }

        if (p.trail.length > 1 && !p.arc) {
            ctx.strokeStyle = 'rgba(255, 255, 150, 0.35)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.stroke();
        }

        if (p.arc) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y - lift, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.arc ? '#ff9a3c' : 'rgba(255, 170, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

 
// Separate hostile ammunition: enemy gunmen can destroy player defenses.
let enemyProjectiles = [];
function updateEnemyProjectiles(dt) {
    enemyProjectiles.forEach((p) => {
        if (!towers.includes(p.target)) { p.done = true; return; }
        const dx = p.target.x - p.x, dy = p.target.y - p.y;
        const dist = Math.hypot(dx, dy), step = p.speed * dt / 1000;
        if (dist <= Math.max(5, step)) {
            p.target.hp -= p.damage;
            createImpactEffect(p.target.x, p.target.y, p.color);
            if (p.target.hp <= 0) {
                const i = towers.indexOf(p.target);
                if (i !== -1) towers.splice(i, 1);
                gameState.selectedTowers = gameState.selectedTowers.filter(t => t !== p.target);
                createExplosion(p.target.x, p.target.y, 30, 'rgba(255,110,50,.6)');
            }
            p.done = true;
        } else { p.x += dx / dist * step; p.y += dy / dist * step; }
    });
    enemyProjectiles = enemyProjectiles.filter(p => !p.done);
}
function drawEnemyProjectiles(ctx) {
    enemyProjectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    });
}
