let towers = [];

const TOWER_TYPES = {
    BASIC: {
        cost: 50,
        range: 150,
        damage: 25,
        fireRate: 800,
        color: '#4169e1',
        name: 'Tour Basique'
    },
    RAPID: {
        cost: 70,
        range: 120,
        damage: 16,
        fireRate: 420,
        color: '#27ae60',
        name: 'Tour Rapide'
    },
    SNIPER: {
        cost: 95,
        range: 225,
        damage: 40,
        fireRate: 1250,
        color: '#8e44ad',
        name: 'Tour Sniper'
    }
};

function addTower(x, y, type = 'BASIC') {
    const template = TOWER_TYPES[type] || TOWER_TYPES.BASIC;

    towers.push({
        x,
        y,
        type: type,
        range: template.range,
        damage: template.damage,
        fireRate: template.fireRate,
        color: template.color,
        lastShot: 0,
        target: null,
        kills: 0,
        level: 1
    });
}

function updateTowers(_deltaTime) {
    const currentTime = Date.now();

    towers.forEach((tower) => {
        if (!tower.target || tower.target.life <= 0) {
            tower.target = getNearestEnemy(tower.x, tower.y, tower.range);
        }

        if (tower.target) {
            const dist = distance(tower.x, tower.y, tower.target.x, tower.target.y);
            if (dist > tower.range) {
                tower.target = null;
            }
        }

        if (tower.target && currentTime - tower.lastShot > tower.fireRate) {
            shootProjectile(tower, tower.target);
            tower.lastShot = currentTime;
        }
    });
}

function drawTowers(ctx) {
    towers.forEach((tower) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(tower.x, tower.y + TOWER_SIZE / 2 + 2, TOWER_SIZE / 2, TOWER_SIZE / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const groupSelected = Array.isArray(gameState.selectedTowers) && gameState.selectedTowers.includes(tower);
        if (gameState.selectedTower === tower || groupSelected || gameState.placingTower) {
            drawCircle(ctx, tower.x, tower.y, tower.range, 'rgba(65, 105, 225, 0.15)');
        }

        const gradient = ctx.createRadialGradient(
            tower.x, tower.y - 5, 5,
            tower.x, tower.y, TOWER_SIZE / 2
        );
        gradient.addColorStop(0, '#6495ed');
        gradient.addColorStop(1, tower.color || '#4169e1');
        ctx.fillStyle = gradient;
        ctx.fillRect(tower.x - TOWER_SIZE / 2, tower.y - TOWER_SIZE / 2, TOWER_SIZE, TOWER_SIZE);

        const selected = gameState.selectedTower === tower || groupSelected;
        ctx.strokeStyle = selected ? '#FFD700' : '#1e3a8a';
        ctx.lineWidth = selected ? 3 : 2;
        ctx.strokeRect(tower.x - TOWER_SIZE / 2, tower.y - TOWER_SIZE / 2, TOWER_SIZE, TOWER_SIZE);

        if (tower.target) {
            const angle = angleToTarget(tower.x, tower.y, tower.target.x, tower.target.y);
            const cannonLength = TOWER_SIZE / 2 + 5;

            ctx.strokeStyle = '#1e3a8a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo(
                tower.x + Math.cos(angle) * cannonLength,
                tower.y + Math.sin(angle) * cannonLength
            );
            ctx.stroke();

            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(
                tower.x + Math.cos(angle) * cannonLength,
                tower.y + Math.sin(angle) * cannonLength,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else {
            ctx.strokeStyle = '#1e3a8a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo(tower.x, tower.y - TOWER_SIZE / 2 - 5);
            ctx.stroke();
        }

        if (tower.level > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv${tower.level}`, tower.x, tower.y - TOWER_SIZE / 2 - 8);
            ctx.textAlign = 'left';
        }

        const typeLabel = tower.type === 'SNIPER' ? 'S' : (tower.type === 'RAPID' ? 'R' : 'B');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(typeLabel, tower.x, tower.y + 3);
        ctx.textAlign = 'left';

        if (tower.kills > 5) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${tower.kills}`, tower.x, tower.y + TOWER_SIZE / 2 + 14);
            ctx.textAlign = 'left';
        }
    });
}

function shootProjectile(tower, target) {
    const angle = angleToTarget(tower.x, tower.y, target.x, target.y);
    const velocity = vectorFromAngle(angle, 0.4);

    projectiles.push({
        x: tower.x,
        y: tower.y,
        vx: velocity.x,
        vy: velocity.y,
        damage: tower.damage,
        target: target,
        tower: tower,
        trail: []
    });
}

function getTowerAt(x, y) {
    return towers.find((tower) =>
        Math.abs(tower.x - x) < TOWER_SIZE / 2 &&
        Math.abs(tower.y - y) < TOWER_SIZE / 2
    );
}

function getUpgradeCost(tower) {
    return Math.floor(35 + (tower.level * 28));
}

function upgradeTower(tower, strategy = 'neutre') {
    if (!tower || !gameState) return false;

    const cost = getUpgradeCost(tower);
    if (gameState.money < cost) return false;
    gameState.money -= cost;

    const profile = String(strategy || 'neutre').toLowerCase();
    let damageBonus = 6;
    let rangeBonus = 8;
    let speedFactor = 0.95;

    if (profile === 'guerrier') {
        damageBonus = 8;
        rangeBonus = 6;
        speedFactor = 0.94;
    } else if (profile === 'scientifique') {
        damageBonus = 4;
        rangeBonus = 13;
        speedFactor = 0.96;
    } else if (profile === 'magnat') {
        damageBonus = 5;
        rangeBonus = 8;
        speedFactor = 0.97;
    } else if (profile === 'pacifique') {
        damageBonus = 5;
        rangeBonus = 11;
        speedFactor = 0.96;
    }

    tower.level += 1;
    tower.damage += damageBonus;
    tower.range += rangeBonus;
    tower.fireRate = Math.max(180, Math.floor(tower.fireRate * speedFactor));
    return true;
}

function upgradeTowerGroup(group, strategy = 'neutre', maxOperations = 999) {
    if (!Array.isArray(group) || group.length === 0) return 0;

    const sorted = group.slice().sort((a, b) => (a.level || 1) - (b.level || 1));
    const cap = Math.max(1, Math.floor(Number(maxOperations) || 1));
    let upgraded = 0;

    sorted.forEach((tower) => {
        if (upgraded >= cap) return;
        if (upgradeTower(tower, strategy)) {
            upgraded += 1;
        }
    });

    return upgraded;
}

