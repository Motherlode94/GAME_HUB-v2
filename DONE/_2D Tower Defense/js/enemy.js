let enemies = [];

const ENEMY_TYPES = {
    BASIC: {
        name: "Normal",
        color: "#ff4444",
        speedBase: 0.05,
        healthBase: 100,
        rewardBase: 10,
        scoreValue: 10
    },
    FAST: {
        name: "Runner",
        color: "#ff00aa",
        speedBase: 0.085,
        healthBase: 65,
        rewardBase: 15,
        scoreValue: 20
    },
    TANK: {
        name: "Tank",
        color: "#773300",
        speedBase: 0.035,
        healthBase: 280,
        rewardBase: 25,
        scoreValue: 50
    },
    BOSS: {
        name: "Boss",
        color: "#ff6600",
        speedBase: 0.04,
        healthBase: 500,
        rewardBase: 100,
        scoreValue: 200
    }
};

function getEnemyTypeForWave(wave) {
    // Boss tous les 10 vagues
    if (wave % 10 === 0 && wave > 0) {
        return "BOSS";
    }
    
    if (wave >= 15) {
        const rand = Math.random();
        if (rand < 0.3) return "TANK";
        if (rand < 0.65) return "FAST";
        return "BASIC";
    }
    if (wave >= 12) return Math.random() < 0.35 ? "TANK" : (Math.random() < 0.6 ? "FAST" : "BASIC");
    if (wave >= 10) return Math.random() < 0.60 ? "FAST" : "BASIC";
    if (wave >= 6)  return Math.random() < 0.45 ? "FAST" : "BASIC";
    if (wave >= 3)  return Math.random() < 0.25 ? "FAST" : "BASIC";
    return "BASIC";
}

function spawnEnemy(wave) {
    const spawn = getSpawnPoint();
    const typeKey = getEnemyTypeForWave(wave);
    const type = ENEMY_TYPES[typeKey];

    const healthMultiplier = 1 + (wave * 0.22);
    const speedMultiplier = 1 + (wave * 0.10);
    const isBoss = typeKey === "BOSS";

    enemies.push({
        x: spawn.x,
        y: spawn.y,
        type: typeKey,
        color: type.color,
        speed: type.speedBase * speedMultiplier,
        maxLife: Math.floor(type.healthBase * healthMultiplier * (isBoss ? 2 : 1)),
        life: Math.floor(type.healthBase * healthMultiplier * (isBoss ? 2 : 1)),
        pathIndex: 0,
        reward: Math.floor(type.rewardBase + wave * 2),
        scoreValue: type.scoreValue + wave * 5,
        isBoss: isBoss,
        size: isBoss ? ENEMY_SIZE * 1.5 : ENEMY_SIZE
    });
}

function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        if (enemy.pathIndex < path.length - 1) {
            const target = {
                x: gridToWorld(path[enemy.pathIndex + 1].x) + TILE_SIZE / 2,
                y: gridToWorld(path[enemy.pathIndex + 1].y) + TILE_SIZE / 2
            };

            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                enemy.pathIndex++;
            } else {
                enemy.x += (dx / dist) * enemy.speed * deltaTime;
                enemy.y += (dy / dist) * enemy.speed * deltaTime;
            }
        } else {
            enemy.reachedEnd = true;
        }
    });

    enemies = enemies.filter(enemy => {
        if (enemy.reachedEnd) {
            gameState.lives -= (enemy.isBoss ? 5 : 1);
            return false;
        }
        if (enemy.life <= 0) {
            gameState.money += enemy.reward;
            gameState.score += enemy.scoreValue;
            gameState.killCount++;
            
            // Effet visuel de mort
            createDeathParticles(enemy.x, enemy.y, enemy.color);
            return false;
        }
        return true;
    });
}

function createDeathParticles(x, y, color) {
    // Créer des particules à la mort de l'ennemi
    if (!window.particles) window.particles = [];
    
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 2 + Math.random() * 2;
        window.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: 30,
            maxLife: 30,
            size: 4
        });
    }
}

function updateParticles(deltaTime) {
    if (!window.particles) return;
    
    window.particles = window.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravité
        p.life--;
        return p.life > 0;
    });
}

function drawParticles(ctx) {
    if (!window.particles) return;
    
    window.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

function drawEnemies(ctx) {
    enemies.forEach(enemy => {
        const size = enemy.size || ENEMY_SIZE;
        
        // Ombre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + size/2 + 2, size/2, size/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corps
        ctx.fillStyle = enemy.color;
        if (enemy.isBoss) {
            // Boss en forme d'étoile
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * size/2;
                const y = Math.sin(angle) * size/2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                const innerAngle = angle + Math.PI / 5;
                const ix = Math.cos(innerAngle) * size/4;
                const iy = Math.sin(innerAngle) * size/4;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillRect(enemy.x - size / 2, enemy.y - size / 2, size, size);
        }

        // Indicateurs visuels
        if (enemy.type === "FAST") {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemy.x - 8, enemy.y);
            ctx.lineTo(enemy.x + 8, enemy.y);
            ctx.moveTo(enemy.x, enemy.y - 8);
            ctx.lineTo(enemy.x, enemy.y + 8);
            ctx.stroke();
        }

        if (enemy.type === "TANK" || enemy.isBoss) {
            ctx.strokeStyle = enemy.isBoss ? "#ffaa00" : "#000";
            ctx.lineWidth = enemy.isBoss ? 3 : 4;
            ctx.strokeRect(enemy.x - size / 2 - 2, enemy.y - size / 2 - 2, size + 4, size + 4);
        }

        // Barre de vie améliorée
        const barWidth = size;
        const barHeight = 5;
        const healthPercent = Math.max(0, enemy.life / enemy.maxLife);

        // Fond noir
        ctx.fillStyle = "#000";
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size / 2 - 12, barWidth, barHeight);

        // Barre de vie colorée
        let healthColor;
        if (healthPercent > 0.6) healthColor = "#0f0";
        else if (healthPercent > 0.3) healthColor = "#ff0";
        else healthColor = "#f00";
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size / 2 - 12, barWidth * healthPercent, barHeight);

        // Bordure
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x - barWidth / 2, enemy.y - size / 2 - 12, barWidth, barHeight);
        
        // Nom du boss
        if (enemy.isBoss) {
            ctx.fillStyle = "#ffaa00";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("BOSS", enemy.x, enemy.y - size / 2 - 18);
            ctx.textAlign = "left";
        }
    });
}

function getNearestEnemy(x, y, range) {
    let nearest = null;
    let minDist = range;

    enemies.forEach(enemy => {
        const dist = distance(x, y, enemy.x, enemy.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });

    return nearest;
}